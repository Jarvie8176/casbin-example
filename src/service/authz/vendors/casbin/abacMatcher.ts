import * as _ from "lodash";
import { InvalidInput } from "src/errors";
import { myMatcherWrapper } from "./matcher";

export class AbacMatcher {
  private static readonly matcher = myMatcherWrapper;

  constructor(private matchedPolicies: (any[])[] = [], private checkedPolicies: (any[])[] = []) {}

  /**
   * implements proxy pattern to capture policy matching result
   */
  match(policy: any[], params: any[]): boolean {
    this.checkedPolicies.push(policy);
    let matchResult = AbacMatcher.matcher(...params);
    if (matchResult) this.matchedPolicies.push(policy);
    return matchResult;
  }

  getCheckedPolicies() {
    return this.checkedPolicies;
  }

  getMatchedPolicies() {
    return this.matchedPolicies;
  }

  /**
   * casbin matcher interface
   */
  static AbacMatcherWrapper(...args: any[]): boolean {
    // args = [r.matcher, p.act, p.obj, r.input, p.op, p.p1, p.p2]
    // extract abacMatcher from args
    const abacMatcher = _.nth(args, 0);
    args = args.splice(1);

    const p_act = _.nth(args, 0);
    const p_obj = _.nth(args, 1);
    const r_input = _.nth(args, 2);
    const p_op = _.nth(args, 3);
    const p_p1 = _.nth(args, 4);
    const p_p2 = _.nth(args, 5);
    const params = [r_input, p_op, p_p1, p_p2];
    const policy = [p_act, p_obj, p_op, p_p1, p_p2];

    try {
      return abacMatcher instanceof AbacMatcher ? abacMatcher.match(policy, params) : AbacMatcher.matcher(...params);
    } catch (err) {
      if (err instanceof InvalidInput) return false;
      throw err;
    }
  }
}
