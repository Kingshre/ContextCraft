// apps/api/src/llm.ts
import OpenAI from "openai";
import { validatePreservation } from "./validate.js";

type RuleId = "TONE" | "CLARITY" | "JARGON" | "CONSISTENCY";

type NodeValidation = {
  ok: boolean;
  issues: any[];
  anchors: any;
};

type RewriteNodeResult = {
  rewritten: string;
  reason: string;
  rule_id: RuleId;
  warnings: string[];
  validation: NodeValidation;
};

function clampRuleId(x: any): RuleId {
  return x === "TONE" || x === "CLARITY" || x === "JARGON" || x === "CONSISTENCY" ? x : "CLARITY";
}

function safeJsonParse(raw: string): any {
  const cleaned = (raw || "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/** --------- Rate limit / quota retry helpers --------- */
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRateLimitError(err: any) {
  const status = err?.status ?? err?.response?.status;
  const msg = String(err?.message ?? "");
  return status === 429 || msg.includes("429") || msg.toLowerCase().includes("rate");
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 4) {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      if (!isRateLimitError(err)) throw err;

      // 0.5s, 1s, 2s, 4s (+ jitter)
      const base = 500 * Math.pow(2, i);
      const jitter = Math.floor(Math.random() * 150);
      await sleep(base + jitter);
    }
  }
  throw lastErr;
}
/** ---------------------------------------------------- */

async function callModel(params: {
  client: OpenAI;
  text: string;
  profile: "startup" | "enterprise" | "general";
  strength: "conservative" | "moderate" | "aggressive";
  strictMode: boolean;
}) {
  const { client, text, profile, strength, strictMode } = params;

  const system =
    `You are ContextCraft. Rewrite the given text for the target audience.\n` +
    `Hard constraints: preserve meaning; do not add facts; do not change numbers/dates/names.\n` +
    `Return JSON ONLY with keys: rewritten, reason, rule_id.\n` +
    `rule_id must be one of: TONE, CLARITY, JARGON, CONSISTENCY.\n` +
    `If no rewrite is needed, set rewritten equal to the input text, but STILL provide reason and rule_id.\n` +
    (strictMode
      ? `\nSTRICT MODE:\n- You MUST preserve every number, date, percent, money token, and proper name EXACTLY.\n- You MUST NOT introduce any new numbers/dates.\n- If unsure, return the original text unchanged.\n`
      : "");

  const resp = await withRetry(() =>
    client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: strength === "conservative" ? 0.2 : strength === "moderate" ? 0.4 : 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `Profile: ${profile}\nStrength: ${strength}\n\nText:\n"""${text}"""`,
        },
      ],
    })
  );

  const raw = resp.choices[0]?.message?.content ?? "";
  return safeJsonParse(raw) ?? {};
}

export async function rewriteNode(params: {
  client: OpenAI;
  text: string;
  profile: "startup" | "enterprise" | "general";
  strength: "conservative" | "moderate" | "aggressive";
}): Promise<RewriteNodeResult> {
  const { client, text, profile, strength } = params;

  const warnings: string[] = [];

  // Attempt 1: normal
  let parsed = await callModel({ client, text, profile, strength, strictMode: false });

  let rewritten =
    typeof parsed.rewritten === "string" && parsed.rewritten.trim().length > 0 ? parsed.rewritten : text;

  let reason =
    typeof parsed.reason === "string" && parsed.reason.trim().length > 0
      ? parsed.reason
      : rewritten === text
        ? "No rewrite needed for the selected profile."
        : "Improved clarity and tone while preserving meaning.";

  let rule_id = clampRuleId(parsed.rule_id);

  // Validate
  let v = validatePreservation(text, rewritten) as NodeValidation;

  // Retry up to 2 times in STRICT MODE if invalid
  for (let attempt = 1; attempt <= 2 && !v.ok; attempt++) {
    warnings.push(`retry_${attempt}: validation_failed`);

    parsed = await callModel({ client, text, profile, strength, strictMode: true });

    rewritten =
      typeof parsed.rewritten === "string" && parsed.rewritten.trim().length > 0 ? parsed.rewritten : text;

    reason =
      typeof parsed.reason === "string" && parsed.reason.trim().length > 0
        ? parsed.reason
        : "Rewrote while preserving anchors.";

    rule_id = clampRuleId(parsed.rule_id);

    v = validatePreservation(text, rewritten) as NodeValidation;
  }

  // Final fallback if still invalid
  if (!v.ok) {
    warnings.push("fallback_to_original: preservation_validation_failed");
    rewritten = text;
    reason = "Returned original text because rewrite failed preservation validation.";
    rule_id = "CONSISTENCY";
    v = validatePreservation(text, rewritten) as NodeValidation;
  }

  return {
    rewritten,
    reason,
    rule_id,
    warnings,
    validation: v,
  };
}
