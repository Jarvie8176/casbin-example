import { PatientsServiceRequest } from "../../common/interfaces/serviceRequest";
import { PatientsService } from "./patients.service";
import { AuthzQuery } from "../authz/vendors/authz.vendors";
import { getMetadata } from "../../common/metadata/api.module.metadata";
import { Test } from "@nestjs/testing";
import { AuthorizationService } from "../authz/authz.service";
import { getMockConnection } from "../../utils";
import { entities } from "ormconfig";

describe("PatientsService: authz", () => {
  describe("translation", () => {
    it("converts input into an authz request", async () => {
      const module = await Test.createTestingModule(getMetadata(true)).compile();
      const patientsService: PatientsService = module.get("PatientsService");
      const authzService: AuthorizationService = module.get("AuthorizationService");
      await authzService.onModuleInit();
      let authzRequestCaptured: PatientsServiceRequest;
      jest
        .spyOn(patientsService, "translateRequestToAuthzQuery")
        .mockImplementation((request: PatientsServiceRequest) => {
          authzRequestCaptured = request;
          return [];
        });
      let mockConnection = await getMockConnection(entities);
      jest.spyOn(patientsService, "getConnection").mockImplementation(() => mockConnection);

      await patientsService.detail(1, ["billingInfo"]);
      expect(authzRequestCaptured).toEqual(<PatientsServiceRequest>{
        subject: null,
        target: {
          patientId: 1,
          action: "view",
          attributes: ["patientInfo", "billingInfo"]
        }
      });
    });
    it("translates a request into AuthzQuery", async () => {
      const request = <PatientsServiceRequest>{
        subject: { user: { id: 1 } },
        target: {
          patientId: 1,
          action: "view",
          attributes: ["patientInfo", "medicalRecord", "billingInfo"]
        }
      };

      const module = await Test.createTestingModule(getMetadata(true)).compile();
      const patientsService: PatientsService = module.get("PatientsService");
      expect(patientsService.translateRequestToAuthzQuery(request)).toEqual([
        <AuthzQuery>{
          input: {
            user: { id: 1 }
          },
          target: "patient:1:patientInfo",
          action: "view"
        },
        <AuthzQuery>{
          input: {
            user: { id: 1 }
          },
          target: "patient:1:medicalRecord",
          action: "view"
        },
        <AuthzQuery>{
          input: {
            user: { id: 1 }
          },
          target: "patient:1:billingInfo",
          action: "view"
        }
      ]);
    });
  });
});
