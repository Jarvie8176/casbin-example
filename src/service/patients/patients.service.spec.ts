import { PatientsServiceRequest } from "../../common/interfaces/patients.service";
import { PatientsService } from "./patients.service";
import { AuthzQuery } from "../authz/vendors/authz.vendors";
import { getMetadata } from "../../common/metadata/api.module.metadata";
import { Test } from "@nestjs/testing";
import { getMockConnection } from "../../utils";
import { entities } from "ormconfig";
import { Unauthorized } from "../../common/errors";
import { Connection } from "typeorm";

describe("PatientsService: authz", () => {
  let patientsService: PatientsService;
  let mockConnection: Connection;

  beforeEach(async () => {
    const module = await Test.createTestingModule(getMetadata(true)).compile();
    patientsService = module.get("PatientsService");
    await patientsService.onModuleInit();
    mockConnection = await getMockConnection(entities);
    jest.spyOn(patientsService, "getConnection").mockImplementation(() => mockConnection);
  });

  afterEach(async () => {
    await mockConnection.close();
  });

  describe("translation", () => {
    it("converts input into an authz request", async () => {
      let authzRequestCaptured: PatientsServiceRequest = null;
      jest
        .spyOn(patientsService, "translateRequestToAuthzQuery")
        .mockImplementation((request: PatientsServiceRequest) => {
          authzRequestCaptured = request;
          return [];
        });

      await patientsService.detail(null, 1, ["billingInfo"]);
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

  describe("decision", () => {
    it("throws an error on a failed authorization check", async () => {
      await expect(patientsService.detail(null, 1)).rejects.toThrow(Unauthorized);
    });
  });
});
