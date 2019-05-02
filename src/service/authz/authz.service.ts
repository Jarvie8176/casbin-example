import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { AuthzAdapter, Policy } from "./authz.adapter";
import { Casbin } from "./vendors/casbin/vendors.casbin";
import { AuthzQuery, AuthzVendor } from "./vendors/authz.vendors";
import * as _ from "lodash";
import { InvalidInput, InvalidState } from "../../common/errors";

@Injectable()
export class AuthorizationService implements AuthzAdapter, OnModuleInit {
  static readonly ReservedKeywords = ["__AUTHZ_CTX"];
  static readonly Context = { ADMIN_PRIVILEGE: 5 };

  private inited: boolean = false;

  constructor(@Inject("AuthzVendor") private readonly vendor: AuthzVendor) {}

  async onModuleInit(): Promise<void> {
    await this.init();
  }

  async init(...args: any[]): Promise<void> {
    await this.vendor.init(Casbin.MODEL_PATH, Casbin.POLICY_PATH);
    this.inited = true;
  }

  /**
   * this method implements proxy pattern to inject context
   */
  async getDecision(query: AuthzQuery): Promise<boolean> {
    this.preprocess(query);
    return this.vendor.getDecision(query);
  }

  /**
   * this method implements proxy pattern to inject context
   */
  async getCheckedPolicies(query: AuthzQuery): Promise<Policy[]> {
    this.preprocess(query);
    return this.vendor.getDecisionDetails(query).then(decisionDetails => decisionDetails.checkedPolicies);
  }

  /**
   * this method implements proxy pattern to inject context
   */
  async getMatchedPolicies(query: AuthzQuery): Promise<Policy[]> {
    this.preprocess(query);
    return this.vendor.getDecisionDetails(query).then(decisionDetails => decisionDetails.matchedPolicies);
  }

  private preprocess(query: AuthzQuery): AuthzQuery {
    this.validation(query);
    this.attachContext(query);
    return query;
  }

  private validation(query: AuthzQuery): void {
    // must call init() before the module being used
    if (!this.inited) throw new InvalidState("must call init() first");

    // query.input must not contain reserved keywords
    const reservedKeywordMatch = _.intersection(_.keys(query.input), AuthorizationService.ReservedKeywords);
    if (!_.isEmpty(reservedKeywordMatch)) {
      throw new InvalidInput(`query.input contained reserved keyword(s): ${reservedKeywordMatch.join(", ")}`);
    }
  }

  private attachContext(query: AuthzQuery): AuthzQuery {
    query.input = _.assign({}, query.input, { __AUTHZ_CTX: AuthorizationService.Context });
    return query;
  }

  /**
   * exposed for testing
   */
  getAuthzVendor(): AuthzVendor {
    return this.vendor;
  }
}
