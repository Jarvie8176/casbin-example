import * as _ from "lodash";

function myMatcher(op: string, params: string[]): boolean {
  let fn: Function;
  const p1 = _.nth(params, 0);
  const p2 = _.nth(params, 1);

  switch (op) {
    case "=":
      fn = () => equal(p1, p2);
      break;
    case "!=":
      fn = () => !equal(p1, p2);
      break;
    case "<":
      fn = () => lessThan(p1, p2);
      break;
    case "<=":
      fn = () => equal(p1, p2) || lessThan(p1, p2);
      break;
    case ">":
      fn = () => !equal(p1, p2) && !lessThan(p1, p2);
      break;
    case ">=":
      fn = () => !lessThan(p1, p2);
      break;
    default:
      throw new Error(`unsupported operator: ${op}`);
  }

  return fn();
}

// todo: check null
function equal(p1: any, p2: any): boolean {
  return _.isEqual(p1, p2);
}

// todo: check null
function lessThan(p1: any, p2: any): boolean {
  return p1 < p2;
}

function myMatcherWrapper(input: object, op: string, ...paramPaths: string[]): boolean {
  const params = _.map(paramPaths, paramPath => _.get(input, paramPath));
  return myMatcher(op, params);
}

export { myMatcher, myMatcherWrapper };
