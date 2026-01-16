import { loadProfile } from "./profiles.js";

console.log(loadProfile("startup").rules.map(r => r.rule_id));
console.log(loadProfile("enterprise").rules.map(r => r.rule_id));
console.log(loadProfile("general").rules.map(r => r.rule_id));
