import { Policy } from "../authz.adapter";

export interface DecisionDetails {
  checkedPolicies: Policy[];
  matchedPolicies: Policy[];
}

export interface AuthzQuery {
  data: {};
  action: string;
  target: string;
}

export interface AuthzVendor {
  init(...args: any[]): Promise<any>;
  getDecision(AuthzQuery): Promise<boolean>;
  getDecisionDetails(AuthzQuery): Promise<DecisionDetails>;
}
