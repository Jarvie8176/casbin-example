import * as _ from "lodash";
import { InvalidInput } from "src/common/errors";

function myMatcher(op: string, params: any[]): boolean {
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
    case "in":
      fn = () => within(p1, p2);
      break;
    case "notIn":
      fn = () => !within(p1, p2);
      break;
    default:
      throw new InvalidInput(`unsupported operator: ${op}`);
  }

  return fn();
}

// todo: check null
function equal(p1: any, p2: any): boolean {
  if (!_.isEmpty(_.filter([p1, p2], _.isNil))) {
    throw new InvalidInput("invalid input: parameter must be not null and not undefined");
  }
  return _.isEqual(p1, p2);
}

// todo: check null
function lessThan(p1: any, p2: any): boolean {
  if (!_.isEmpty(_.filter([p1, p2], _.isNil))) {
    throw new InvalidInput("invalid input: parameter must be not null and not undefined");
  }
  return p1 < p2;
}

function within(p1: any[], p2: any): boolean {
  if (!_.isEmpty(_.filter([p1, p2], _.isNil))) {
    throw new Error("invalid input: parameter must be not null and not undefined");
  }
  return _.includes(p1, p2);
}

function myMatcherWrapper(...args: any[]): boolean {
  const input = args[0];
  const op = args[1];
  const paramPaths = args.splice(2);
  const params = _.map(paramPaths, paramPath => {
    return _.get(input, paramPath);
  });
  return myMatcher(op, params);
}

export { myMatcher, myMatcherWrapper };
