import { AuthorizationService } from "./authz.service";
import { AuthzQuery, AuthzVendor } from "./vendors/authz.vendors";
import { Casbin } from "./vendors/casbin/vendors.casbin";
import { Test } from "@nestjs/testing";
import { metadata } from "../../common/metadata/authz.module.metadata";
import { InvalidState } from "../../common/errors";

describe("authorization module", () => {
  describe("init", () => {
    it("throws error if init() is not called before the module being used", async () => {
      const module = await Test.createTestingModule(metadata).compile();
      const authzService = module.get("AuthorizationService");
      await expect(authzService.getDecision({ input: {}, action: "", target: "" })).rejects.toThrow(InvalidState);
    });
  });

  describe("context", () => {
    let authzVendor: AuthzVendor;
    let authzService: AuthorizationService;

    beforeEach(async () => {
      const module = await Test.createTestingModule(metadata).compile();
      authzVendor = module.get("Casbin");
      authzService = module.get("AuthorizationService");
      await authzService.onModuleInit();
    });

    it("enriches input with context", async () => {
      const module = await Test.createTestingModule(metadata).compile();
      authzService = module.get("AuthorizationService");
      await authzService.onModuleInit();

      jest.spyOn(authzService.getAuthzVendor(), "getDecision").mockImplementation(async (query: AuthzQuery) => {
        inputExtracted = query.input;
        return true;
      });

      let inputExtracted: {} = null;
      await authzService.getDecision({ input: { a: 1 }, action: "", target: "" });
      expect(inputExtracted).toEqual({ a: 1, __AUTHZ_CTX: AuthorizationService.Context });
    });

    it("rejects request if input contains reserved keyword", async () => {
      const authzQuery: AuthzQuery = { input: { a: 1, __AUTHZ_CTX: {} }, action: "", target: "" };
      await expect(authzService.getDecision(authzQuery)).rejects.toThrow();
      await expect(authzService.getCheckedPolicies(authzQuery)).rejects.toThrow();
      await expect(authzService.getMatchedPolicies(authzQuery)).rejects.toThrow();
    });
  });

  describe("usage", () => {
    let authzService: AuthorizationService;

    beforeEach(async () => {
      const module = await Test.createTestingModule(metadata).compile();
      authzService = module.get("AuthorizationService");
      await authzService.onModuleInit();
    });

    describe("decision", () => {
      it("performs a simple authorization check", async () => {
        expect(
          await authzService.getDecision({
            input: { user: { id: 1 }, patient: { id: 1 } },
            target: "patient:1:",
            action: "view"
          })
        ).toEqual(true);
        expect(
          await authzService.getDecision({
            input: { user: { id: 2 }, patient: { id: 1 } },
            target: "patient:1:",
            action: "view"
          })
        ).toEqual(false);
      });
    });

    describe("reverse query", async () => {
      it("returns a list of checked policies", async () => {
        expect(
          await authzService.getCheckedPolicies({
            input: { user: { id: 1 }, patient: { id: 2 } },
            target: "patient:1:medicalRecord",
            action: "view"
          })
        ).toEqual([
          Casbin.CasbinPolicyToPolicy(["view", "patient:.*:.*", "=", "user.id", "patient.id"]),
          Casbin.CasbinPolicyToPolicy([
            "view",
            "patient:.*:.*",
            ">=",
            "user.privilegeLevel",
            "__AUTHZ_CTX.ADMIN_PRIVILEGE"
          ]),
          Casbin.CasbinPolicyToPolicy([
            "view",
            "patient:.*:medicalRecord",
            "=",
            "user.id",
            "patient.medicalRecord.assignedTo"
          ])
        ]);
      });
    });

    describe("decision details", async () => {
      it("returns a list of matched policies", async () => {
        expect(
          await authzService.getMatchedPolicies({
            input: { user: { id: 1 }, patient: { id: 1 } },
            target: "patient:1:medicalRecord",
            action: "view"
          })
        ).toEqual([Casbin.CasbinPolicyToPolicy(["view", "patient:.*:.*", "=", "user.id", "patient.id"])]);
      });
    });
  });
});
