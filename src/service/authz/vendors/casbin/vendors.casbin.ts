import * as _ from "lodash";
import * as path from "path";
import { newEnforcer, Model, Enforcer } from "casbin";
import { Policy } from "../../authz.adapter";
import { AuthzQuery, AuthzVendor, DecisionDetails } from "../authz.vendors";
import { AbacMatcher } from "./abacMatcher";
import { Injectable } from "@nestjs/common";
import { PolicyFromRawPolicy } from "./utils";

@Injectable()
export class Casbin implements AuthzVendor {
  static readonly MODEL_PATH = path.join(__dirname, "abac_model.conf");
  static readonly POLICY_PATH = path.join(__dirname, "abac_policy.csv");

  private enforcer: Enforcer;

  async init(model: string | Model, policyPath?: string): Promise<this> {
    this.enforcer = await newEnforcer(model, policyPath);
    this.enforcer.addFunction("abacMatcher", AbacMatcher.AbacMatcherWrapper);
    return this;
  }

  async addPolicy(...params: string[]): Promise<this> {
    await this.enforcer.addPolicy(...params);
    return this;
  }

  async getDecision(params: AuthzQuery): Promise<boolean> {
    // r = input, obj, act, matcher
    return this.enforcer.enforce(params.input, params.target, params.action);
  }

  async getDecisionDetails(params: AuthzQuery): Promise<DecisionDetails> {
    const abacMatcher = new AbacMatcher();
    // r = input, obj, act, matcher
    await this.enforcer.enforce(params.input, params.target, params.action, abacMatcher);
    return {
      checkedPolicies: _.map(abacMatcher.getCheckedPolicies(), Casbin.CasbinPolicyToPolicy),
      matchedPolicies: _.map(abacMatcher.getMatchedPolicies(), Casbin.CasbinPolicyToPolicy)
    };
  }
  static CasbinPolicyToPolicy(p: any[]): Policy {
    return PolicyFromRawPolicy(p);
  }
}
