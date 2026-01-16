import express from "express";
import cors from "cors";
import "dotenv/config";
import OpenAI from "openai";
import pLimit from "p-limit";
import { rewriteNode } from "./llm.js";

const app = express();
const DEBUG = process.env.DEBUG === "1";

app.use(cors());
app.use(express.json({ limit: "2mb" }));

function simpleDiff(original: string, rewritten: string) {
  if (original === rewritten) return "";
  return `- ${original}\n+ ${rewritten}`;
}

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.post("/transform", async (req, res) => {
  try {
    const { markdown, profile, strength } = req.body ?? {};

    if (typeof markdown !== "string") {
      return res.status(400).json({ error: "markdown must be a string" });
    }

    if (!["startup", "enterprise", "general"].includes(profile)) {
      return res.status(400).json({ error: "profile must be startup | enterprise | general" });
    }

    // Load core (ESM build)
    const core = await import("../../../packages/core/dist/index.js");
    const { parseMarkdown, loadProfile } = core as any;

    const parsed = parseMarkdown(markdown);
    const prof = loadProfile(profile);

    const apiKey = process.env.OPENAI_API_KEY || "";
    if (!apiKey) {
      return res.status(500).json({
        error: "missing_api_key",
        message: "OPENAI_API_KEY is not set. Add it to apps/api/.env and restart the server."
      });
    }

    const client = new OpenAI({ apiKey });

    // Dev-safe concurrency to reduce 429s
    const limit = pLimit(1);

    const strengthSafe =
      strength === "conservative" || strength === "moderate" || strength === "aggressive"
        ? strength
        : "moderate";

    const rewrittenNodes = await Promise.all(
      parsed.textNodes.map((n: any) =>
        limit(async () => {
          const out = await rewriteNode({
            client,
            text: n.text,
            profile,
            strength: strengthSafe
          });

          return {
            ...n,
            rewritten: out.rewritten,
            reason: out.reason,
            rule_id: out.rule_id,
            warnings: out.warnings,
            validation: out.validation
          };
        })
      )
    );

    const changes = rewrittenNodes.map((n: any) => ({
      node_id: n.node_id,
      node_type: n.type,
      change_type: n.rewritten === n.text ? "unchanged" : "modify",
      original: n.text,
      transformed: n.rewritten,
      rule_id: n.rule_id,
      reason: n.reason,
      warnings: n.warnings ?? []
    }));

    const transformed_markdown = rewrittenNodes.map((n: any) => n.rewritten).join("\n\n");

    // ---- Real validation + fidelity score ----
    const nodeValidations = rewrittenNodes.map((n: any) => n.validation).filter(Boolean);
    const failed = nodeValidations.filter((v: any) => v.ok === false);

    // Simple v1 scoring: 1 if all nodes pass, else 0
    const fidelity_score = failed.length === 0 ? 1 : 0;

    const validationWarnings = nodeValidations.flatMap((v: any) =>
      (v.issues ?? []).map((i: any) => i.message ?? String(i))
    );

    // ---- Simple v1 diff ----
    const diff = rewrittenNodes
      .map((n: any) => simpleDiff(n.text, n.rewritten))
      .filter(Boolean)
      .join("\n");

    return res.json({
      transformed_markdown,
      diff,
      changes,
      structural_recommendations: [],
      validation: { fidelity_score, warnings: validationWarnings },
      ...(DEBUG
        ? {
            debug: {
              profile,
              strength: strengthSafe,
              text_nodes: parsed.textNodes,
              profile_rules: prof.rules
            }
          }
        : {})
    });
  } catch (err: any) {
    const status = err?.status ?? err?.response?.status;
    const msg = err?.message ?? String(err);

    if (status === 429 || String(msg).includes("429")) {
      return res.status(429).json({
        error: "rate_limited_or_quota",
        message:
          "OpenAI returned 429 (rate limit or quota). If your project/org has no credits or billing enabled, enable billing. Otherwise retry shortly.",
        ...(DEBUG ? { debug: { status, msg } } : {})
      });
    }

    console.error(err);
    return res.status(500).json({
      error: "transform failed",
      message: msg
    });
  }
});

app.listen(4000, "0.0.0.0", () => {
  console.log("API running on http://localhost:4000");
});
