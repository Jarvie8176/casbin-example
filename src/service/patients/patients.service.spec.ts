import { PatientsServiceRequest } from "../../common/interfaces/patients.service";
import { PatientsService } from "./patients.service";
import { AuthzQuery } from "../authz/vendors/authz.vendors";
import { getMetadata } from "../../common/metadata/api.module.metadata";
import { Test } from "@nestjs/testing";
import { getMockConnection } from "../../utils";
import { entities } from "ormconfig";
import { Connection } from "typeorm";
import { ForbiddenException } from "@nestjs/common";

describe("PatientsService: authz", () => {
  let patientsService: PatientsService;
  let mockConnection: Connection;

  beforeEach(async () => {
    const module = await Test.createTestingModule(getMetadata(true)).compile();
    patientsService = module.get("PatientsService");
    await patientsService.onModuleInit();
    mockConnection = await getMockConnection(entities);
    jest.spyOn<any, string>(patientsService, "getConnection").mockImplementation(() => mockConnection);
  });

  afterEach(async () => {
    await mockConnection.close();
  });

  describe("translation", () => {
    beforeEach(async () => {});

    it("converts data into an authz request", async () => {
      let authzRequestCaptured: PatientsServiceRequest = null;
      jest
        .spyOn(patientsService, "translateRequestToAuthzQuery")
        .mockImplementation((request: PatientsServiceRequest) => {
          authzRequestCaptured = request;
          return [];
        });
      jest.spyOn<any, string>(patientsService, "getPatient").mockImplementation(() => {
        return null;
      });

      await patientsService.detail({ id: 1, persona: [{ type: "patient", id: 1 }] }, 1, ["billingInfo"]).catch(err => {
        if (err instanceof ForbiddenException) return;
        throw err;
      });
      expect(authzRequestCaptured).toEqual(<PatientsServiceRequest>{
        subject: { user: { id: 1 }, patient: { id: 1 } },
        target: {
          patient: null,
          action: "view",
          attributes: ["billingInfo", "patientInfo"]
        }
      });
    });

    it("translates a request into AuthzQuery", async () => {
      const request = <PatientsServiceRequest>{
        subject: { user: { id: 1 } },
        target: {
          patient: null,
          action: "view",
          attributes: ["patientInfo", "medicalRecord", "billingInfo"]
        }
      };

      expect(patientsService.translateRequestToAuthzQuery(request)).toEqual([
        <AuthzQuery>{
          data: {
            input: { user: { id: 1 } },
            context: { patient: null }
          },
          target: "patient:*:patientInfo",
          action: "view"
        },
        <AuthzQuery>{
          data: {
            input: { user: { id: 1 } },
            context: { patient: null }
          },
          target: "patient:*:medicalRecord",
          action: "view"
        },
        <AuthzQuery>{
          data: {
            input: { user: { id: 1 } },
            context: { patient: null }
          },
          target: "patient:*:billingInfo",
          action: "view"
        }
      ]);
    });
  });

  describe("decision", () => {
    it("throws an error on a failed authorization check", async () => {
      await expect(patientsService.detail({ id: 9, persona: [] }, 1)).rejects.toThrow(ForbiddenException);
    });
  });
});
