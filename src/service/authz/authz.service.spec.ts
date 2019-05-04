import { AuthorizationService } from "./authz.service";
import { AuthzQuery, AuthzVendor } from "./vendors/authz.vendors";
import { Casbin } from "./vendors/casbin/vendors.casbin";
import { Test } from "@nestjs/testing";
import { metadata } from "../../common/metadata/authz.module.metadata";
import { InvalidState } from "../../common/errors/errors";

describe("authorization module", () => {
  describe("init", () => {
    it("throws error if init() is not called before the module being used", async () => {
      const module = await Test.createTestingModule(metadata).compile();
      const authzService = module.get("AuthorizationService");
      await expect(authzService.getDecision({ data: {}, action: "", target: "" })).rejects.toThrow(InvalidState);
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

    it("enriches data with context", async () => {
      const module = await Test.createTestingModule(metadata).compile();
      authzService = module.get("AuthorizationService");
      await authzService.onModuleInit();

      jest.spyOn(authzService.getAuthzVendor(), "getDecision").mockImplementation(async (query: AuthzQuery) => {
        inputExtracted = query.data;
        return true;
      });

      let inputExtracted: {} = null;
      await authzService.getDecision({ data: { a: 1 }, action: "", target: "", attribute: "" });
      expect(inputExtracted).toEqual({ a: 1, AUTHZ_CTX: AuthorizationService.AUTHZ_CTX });
    });

    it("rejects request if data contains reserved keyword", async () => {
      const authzQuery: AuthzQuery = {
        data: { input: { a: 1 }, AUTHZ_CTX: {} },
        action: "",
        target: "",
        attribute: ""
      };
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
            data: { input: { user: { id: 1 } }, context: { patient: { id: 1 } } },
            target: "patient:1:",
            action: "view",
            attribute: ""
          })
        ).toEqual(true);
        expect(
          await authzService.getDecision({
            data: { input: { user: { id: 2 } }, context: { patient: { id: 1 } } },
            target: "patient:1:",
            action: "view",
            attribute: ""
          })
        ).toEqual(false);
      });
    });

    describe("reverse query", async () => {
      it("returns a list of checked policies", async () => {
        expect(
          await authzService.getCheckedPolicies({
            data: { user: { id: 1 }, patient: { id: 2 } },
            target: "patient:1:medicalRecord",
            action: "view",
            attribute: ""
          })
        ).toEqual([
          Casbin.CasbinPolicyToPolicy(["view", "patient:.*:.*", "=", "input.user.id", "context.patient.id"]),
          Casbin.CasbinPolicyToPolicy([
            "view",
            "patient:.*:.*",
            ">=",
            "input.user.privilegeLevel",
            "AUTHZ_CTX.ADMIN_PRIVILEGE"
          ]),
          Casbin.CasbinPolicyToPolicy([
            "view",
            "patient:.*:medicalRecord",
            "inByPathNested",
            "input.user.id",
            "context.patient.medicalRecords",
            "doctorsAssigned",
            "id"
          ])
        ]);
      });
    });

    describe("decision details", async () => {
      it("returns a list of matched policies", async () => {
        expect(
          await authzService.getMatchedPolicies({
            data: { input: { user: { id: 1 } }, context: { patient: { id: 1 } } },
            target: "patient:1:medicalRecord",
            action: "view",
            attribute: ""
          })
        ).toEqual([Casbin.CasbinPolicyToPolicy(["view", "patient:.*:.*", "=", "input.user.id", "context.patient.id"])]);
      });
    });
  });
});
