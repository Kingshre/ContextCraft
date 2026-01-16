export type Profile = 'startup' | 'enterprise' | 'general';
export type Strength = 'conservative' | 'moderate' | 'aggressive';

export interface TransformRequest {
  markdown: string;
  profile: Profile;
  strength: Strength;
}

export interface Change {
  node_id: string;
  node_type: string;
  change_type: 'unchanged' | 'modify';
  original: string;
  transformed: string;
  rule_id: string;
  reason: string;
  warnings: string[];
}

export interface Validation {
  fidelity_score: number;
  warnings: string[];
}

export interface TransformResponse {
  transformed_markdown: string;
  diff: string;
  changes: Change[];
  validation: Validation;
}

export type ApiStatus = 'idle' | 'loading' | 'success' | 'error';
