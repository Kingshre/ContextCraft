import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const RuleSchema = z.object({
  rule_id: z.string(),
  type: z.enum(["tone", "structural", "constraint"]),
  action: z.string(),
  reason: z.string()
});

const ProfileSchema = z.object({
  rules: z.array(RuleSchema)
});

export type Rule = z.infer<typeof RuleSchema>;
export type Profile = z.infer<typeof ProfileSchema>;

export function loadProfile(profileId: "startup" | "enterprise" | "general"): Profile {
  const repoRoot = path.resolve(process.cwd(), "..", "..");
  const filePath = path.join(repoRoot, "profiles-json", `${profileId}.json`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Profile file not found: ${filePath}`);
  }

const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
const parsed = JSON.parse(raw);

  return ProfileSchema.parse(parsed);
}
