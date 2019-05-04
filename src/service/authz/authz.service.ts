import { Inject, Injectable, OnModuleInit, UnauthorizedException } from "@nestjs/common";
import { AuthzAdapter, Policy } from "./authz.adapter";
import { Casbin } from "./vendors/casbin/vendors.casbin";
import { AuthzQuery, AuthzVendor } from "./vendors/authz.vendors";
import * as _ from "lodash";
import { InvalidState } from "../../common/errors/errors";

@Injectable()
export class AuthorizationService implements AuthzAdapter, OnModuleInit {
  static readonly ReservedKeywords = ["AUTHZ_CTX"];
  static readonly AUTHZ_CTX = { ADMIN_PRIVILEGE: 5 };

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

    // query.data must not contain reserved keywords
    const reservedKeywordMatch = _.intersection(_.keys(query.data), AuthorizationService.ReservedKeywords);
    if (!_.isEmpty(reservedKeywordMatch)) {
      throw new UnauthorizedException(`query.input contained reserved keyword(s): ${reservedKeywordMatch.join(", ")}`);
    }
  }

  /**
   * it mutates the query and adds server side authorization context
   */
  private attachContext(query: AuthzQuery): AuthzQuery {
    query.data = _.extend(query.data, { AUTHZ_CTX: AuthorizationService.AUTHZ_CTX });
    return query;
  }

  /**
   * exposed for testing
   */
  getAuthzVendor(): AuthzVendor {
    return this.vendor;
  }
}
