import { Policy } from "../../authz.adapter";
import * as _ from "lodash";

export function PolicyFromCasbinPolicy(p: string[]): Policy {
  // p = act, obj, op, p1, p2
  const act = _.nth(p, 0);
  const obj = _.nth(p, 1);
  const op = _.nth(p, 2);
  const params = p.slice(3);
  return {
    action: act,
    resource: obj,
    operation: {
      operator: op,
      params: params
    }
  };
}

export function CasbinPolicyFromPolicy(p: Policy): string[] {
  // p = act, obj, op, p1, p2
  return [p.action, p.resource, p.operation.operator, ...p.operation.params];
}
