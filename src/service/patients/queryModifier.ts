import { IQueryModifier, ModificationClause } from "../../common/interfaces/authz";
import { AuthzQuery } from "../authz/vendors/authz.vendors";
import { Policy } from "../authz/authz.adapter";
import { InvalidInput } from "../../common/errors/errors";
import * as _ from "lodash";
import * as uuid from "uuid";

export class QueryModifier<T> implements IQueryModifier {
  constructor(private readonly authzQuery: AuthzQuery, private readonly policy: Policy) {}

  eval(...args: any[]): ModificationClause {
    const op = this.policy.operation.operator;
    switch (op) {
      case "=":
      case "!=":
      case "<":
      case "<=":
      case ">":
      case ">=":
        return this.primitives();
      // case "in": // todo
      // case"notIn": // todo
      case "inByPath":
        return this.inByPath();
      case "inByPathNested":
        return this.inByPathNested();

      default:
        throw new InvalidInput(`unsupported operator: ${op}`);
    }
  }

  public primitives(): ModificationClause {
    let parsedParams: string[] = [];
    let variables: (any[])[] = [];

    _.each(this.policy.operation.params, param => {
      let identifier = this.getIdentifier();
      let parsedParam = param.split(".");
      let scope = _.pullAt(parsedParam, 0)[0];
      switch (scope) {
        case "input":
        case "AUTHZ_CTX":
          parsedParams.push(`:input_${identifier}`);
          variables.push([`input_${identifier}`, _.get(this.authzQuery.data, param)]);
          break;
        case "context":
          parsedParams.push(_.drop(parsedParam, parsedParam.length - 2).join("."));
          break;
        default:
          throw new InvalidInput(`unsupported scope: ${scope}`);
      }
    });

    return {
      queryParticle: `${parsedParams[0]} ${this.policy.operation.operator} ${parsedParams[1]}`,
      params: _.zipObject(_.map(variables, v => v[0]), _.map(variables, v => v[1]))
    };
  }

  in(): ModificationClause {
    return undefined;
  }

  public notIn(): ModificationClause {
    return undefined;
  }

  /**
   * translate the query into "(where) <lhs> = <rhs>", where lhs must be a variable placeholder and rhs must be a column in the entities
   */
  public inByPath(): ModificationClause {
    let lhs = this.policy.operation.params[0];
    let rhs = this.policy.operation.params[1];

    let parsedParams: string[] = [];
    let variable;

    let parsedParam;
    let scope;

    // lhs
    parsedParam = lhs.split(".");
    scope = _.pullAt(parsedParam, 0)[0];

    // validation
    if (!_.includes(["input", "AUTHZ_CTX"], scope)) throw new InvalidInput(`lhs must be either input or AUTHZ_CTX`);

    parsedParams.push(`:input_0`);
    variable = { input_0: _.get(this.authzQuery.data, lhs) };

    // rhs
    parsedParam = rhs.split(".");
    scope = _.pullAt(parsedParam, 0)[0];

    // validation
    if (!_.includes(["context"], scope)) throw new InvalidInput(`rhs must be context`);

    parsedParams.push(_.drop(parsedParam, parsedParam.length - 2).join("."));

    return {
      queryParticle: `${parsedParams[0]} = ${parsedParams[1]}`,
      params: variable
    };
  }

  inByPathNested(): ModificationClause {
    let lhs = _.pullAt(this.policy.operation.params, 0)[0];
    this.policy.operation.params = [
      lhs,
      _.chain(this.policy.operation.params)
        .map(chunk => chunk.split("."))
        .flatten()
        .join(".")
        .value()
    ];
    return this.inByPath();
  }

  // exposed for testing
  private getIdentifier(): string {
    return uuid.v4();
  }
}
