import { Policy } from "../authz.adapter";

export interface DecisionDetails {
  checkedPolicies: Policy[];
  matchedPolicies: Policy[];
}

export interface AuthzQuery {
  input: {};
  action: string;
  target: string;
}

export interface AuthzVendor {
  init(...args: any[]): Promise<any>;
  getDecision(AuthzQuery): Promise<boolean>;
  getDecisionDetails(AuthzQuery): Promise<DecisionDetails>;
}
