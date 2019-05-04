import * as _ from "lodash";
import { InvalidInput } from "src/common/errors/errors";
import { IPolicyMatcher } from "../../../../common/interfaces/authz";

class Matcher implements IPolicyMatcher {
  constructor(private readonly op: any, private readonly params: any[], private readonly input: {}) {}

  eval(): boolean {
    const p1 = _.nth(this.params, 0);
    const p2 = _.nth(this.params, 1);
    const p3 = _.nth(this.params, 2);
    const p4 = _.nth(this.params, 3);

    switch (this.op) {
      case "=":
        return this.eq(p1, p2);
      case "!=":
        return this.ne(p1, p2);
      case "<":
        return this.lt(p1, p2);
      case "<=":
        return this.lte(p1, p2);
      case ">":
        return this.ge(p1, p2);
      case ">=":
        return this.gte(p1, p2);
      case "in":
        return this.in(p1, p2);
      case "notIn":
        return this.notIn(p1, p2);
      case "inByPath":
        return this.inByPath(p1, p2, p3);
      case "inByPathNested":
        return this.inByPathNested(p1, p2, [p3, p4]);
      default:
        throw new InvalidInput(`unsupported operator: ${this.op}`);
    }
  }

  eq(lhs: any, rhs: any): boolean {
    lhs = _.get(this.input, lhs);
    rhs = _.get(this.input, rhs);
    if (_.isNil(lhs)) throw new InvalidInput(`op: ${this.op}, missing lhs: ${lhs}`);
    if (_.isNil(rhs)) throw new InvalidInput(`op: ${this.op}, missing rhs: ${rhs}`);
    return lhs === rhs;
  }

  lt(lhs: any, rhs: any): boolean {
    lhs = _.get(this.input, lhs);
    rhs = _.get(this.input, rhs);
    if (_.isNil(lhs)) throw new InvalidInput(`op: ${this.op}, missing lhs: ${lhs}`);
    if (_.isNil(rhs)) throw new InvalidInput(`op: ${this.op}, missing rhs: ${rhs}`);
    return lhs < rhs;
  }

  lte(lhs: any, rhs: any): boolean {
    return !this.ge(lhs, rhs);
  }

  ne(lhs: any, rhs: any): boolean {
    return !this.eq(lhs, rhs);
  }

  ge(lhs: any, rhs: any): boolean {
    return !this.eq(lhs, rhs) && !this.lt(lhs, rhs);
  }

  gte(lhs: any, rhs: any): boolean {
    return !this.lt(lhs, rhs);
  }

  in(target: any, source: any): boolean {
    return _.includes(_.get(this.input, source), _.get(this.input, target));
  }

  notIn(target: any, source: any): boolean {
    return !this.in(target, source);
  }

  inByPath(targetPath: string, source: any, path: string): boolean {
    return _.chain(this.input)
      .get(source)
      .map(i => _.get(i, path))
      .includes(_.get(this.input, targetPath))
      .value();
  }

  inByPathNested(targetPath: string, source: any, paths: string[]): boolean {
    let chained: any = _.chain(this.input).get(source);
    _.each(paths, path => {
      chained = chained.map(path).flatten();
    });
    return chained.includes(_.get(this.input, targetPath)).value();
  }
}

export class AbacMatcher {
  constructor(private matchedPolicies: (any[])[] = [], private checkedPolicies: (any[])[] = []) {}

  /**
   * implements proxy pattern to capture policy matching result
   */
  match(policy: any[], input: any): boolean {
    this.checkedPolicies.push(policy);
    const op = _.nth(policy, 2);
    const params = policy.slice(3);
    try {
      let matchResult = new Matcher(op, params, input).eval();
      if (matchResult) this.matchedPolicies.push(policy);
      return matchResult;
    } catch (err) {
      return false;
    }
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
    // args = [r.matcher, p.act, p.obj, r.data, p.op, p.p1, p.p2]
    // extract abacMatcher from args
    const abacMatcher = _.nth(args, 0);
    args = args.splice(1);

    const p_act = _.nth(args, 0);
    const p_obj = _.nth(args, 1);
    const r_input = _.nth(args, 2);
    const p_op = _.nth(args, 3);
    const p_pn = args.splice(4);
    const policy = _.reject([p_act, p_obj, p_op, ...p_pn], _.isNil);

    try {
      return abacMatcher instanceof AbacMatcher
        ? abacMatcher.match(policy, r_input)
        : new AbacMatcher().match(policy, r_input);
    } catch (err) {
      if (err instanceof InvalidInput) return false;
      throw err;
    }
  }
}
