export interface Policy {
  name?: string;
  action: string;
  resource: string;
  operation: AuthzOperation;
}

export interface AuthzOperation {
  operator: string;
  params: string[];
}

export interface AuthzAdapter {
  init(...args: any[]): Promise<any>;
  getDecision(...args: any[]): Promise<boolean>;
  getCheckedPolicies(...args: any[]): Promise<Policy[]>;
  getMatchedPolicies(...args: any[]): Promise<Policy[]>;
}
