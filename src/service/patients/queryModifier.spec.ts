import { getMockConnection } from "../../utils";
import { Connection, SelectQueryBuilder } from "typeorm";
import { entities } from "ormconfig";
import { QueryModifier } from "./queryModifier";
import { Patient } from "../../entity/Patient";
import { Policy } from "../authz/authz.adapter";
import { AuthzQuery } from "../authz/vendors/authz.vendors";
import { ModificationClause } from "../../common/interfaces/authz";
import { Doctor } from "../../entity/Doctor";
import { MedicalRecord } from "../../entity/MedicalRecord";
import { BillingInfo } from "../../entity/BillingInfo";
import { Accountant } from "../../entity/Accountant";

describe("QueryModifier", () => {
  let connection: Connection;
  beforeEach(async () => {
    connection = await getMockConnection(entities);
  });

  afterEach(async () => {
    await connection.close();
  });

  describe("functionality", () => {
    describe("primitives", () => {
      it("primitives: =, !=, <, <=, >, >=", () => {
        runner("=");
        runner("!=");
        runner("<");
        runner("<=");
        runner(">");
        runner(">=");
        function runner(op: string) {
          let authzQuery = <AuthzQuery>{
            data: { input: { user: { id: 1 } } },
            action: "view",
            target: "patient:*:patientInfo",
            attribute: "patientInfo"
          };
          let policy = <Policy>{
            action: "view",
            resource: "patient:1:patientInfo",
            operation: { operator: `${op}`, params: ["input.user.id", "context.patient.id"] }
          };
          let queryModifier = new QueryModifier(authzQuery, policy);
          jest.spyOn<any, string>(queryModifier, "getIdentifier").mockImplementation(() => "0");
          expect(queryModifier.primitives()).toEqual(<ModificationClause>{
            queryParticle: `:input_0 ${op} patient.id`,
            params: { input_0: 1 }
          });
        }
      });
    });

    describe("inByPath", () => {
      it("normal usage", () => {
        let authzQuery = <AuthzQuery>{
          data: { input: { user: { id: 1 } } },
          action: "view",
          target: "patient:*:billingInfo",
          attribute: "patientInfo"
        };
        let policy = <Policy>{
          action: "view",
          resource: "patient:*:billingInfo",
          operation: { operator: `inByPath`, params: ["input.user.id", "context.patient.billingInfo.accountant"] }
        };
        let queryModifier = new QueryModifier(authzQuery, policy);
        jest.spyOn<any, string>(queryModifier, "getIdentifier").mockImplementation(() => "0");
        expect(queryModifier.inByPath()).toEqual(<ModificationClause>{
          queryParticle: `:input_0 = billingInfo.accountant`,
          params: {
            input_0: 1
          }
        });
      });
    });

    describe("inByPathNested", () => {
      it("normal usage", () => {
        let authzQuery = <AuthzQuery>{
          data: { input: { user: { id: 1 } } },
          action: "view",
          target: "patient:*:medicalRecords",
          attribute: "patientInfo"
        };
        let policy = <Policy>{
          action: "view",
          resource: "patient:*:medicalRecords",
          operation: {
            operator: `inByPathNested`,
            params: ["input.user.id", "context.patient.medicalRecords.doctorsAssigned.id"]
          }
        };
        let queryModifier = new QueryModifier(authzQuery, policy);
        jest.spyOn<any, string>(queryModifier, "getIdentifier").mockImplementation(() => "0");
        expect(queryModifier.inByPathNested()).toEqual(<ModificationClause>{
          queryParticle: `:input_0 = doctorsAssigned.id`,
          params: {
            input_0: 1
          }
        });
      });
    });
  });

  describe("usage", () => {
    it("rewrites an eq policy", async () => {
      let authzQuery: AuthzQuery;
      let query: SelectQueryBuilder<Patient>;
      let particle: ModificationClause;

      // fixture
      let patient = new Patient();
      patient.id = 123;
      await connection.manager.save(patient);

      let policy = <Policy>{
        action: "view",
        resource: "patient:*:patientInfo",
        operation: {
          operator: "=",
          params: ["input.user.id", "context.patient.id"]
        }
      };
      authzQuery = <AuthzQuery>{
        data: {
          input: {
            user: { id: 123 }
          }
        },
        action: "view",
        target: "patient:*:patientInfo",
        attribute: "patientInfo"
      };

      query = connection
        .getRepository(Patient)
        .createQueryBuilder("patient")
        .leftJoinAndSelect("patient.billingInfo", "billingInfo")
        .leftJoinAndSelect("billingInfo.accountant", "accountant")
        .leftJoinAndSelect("patient.medicalRecords", "medicalRecords")
        .leftJoinAndSelect("medicalRecords.doctorsAssigned", "doctorsAssigned")
        .select("patient.id");
      particle = new QueryModifier(authzQuery, policy).eval();
      query.andWhere(particle.queryParticle, particle.params);
      expect(await query.getMany()).toEqual([patient]);

      authzQuery = <AuthzQuery>{};
      query = connection
        .getRepository(Patient)
        .createQueryBuilder("patient")
        .leftJoinAndSelect("patient.billingInfo", "billingInfo")
        .leftJoinAndSelect("billingInfo.accountant", "accountant")
        .leftJoinAndSelect("patient.medicalRecords", "medicalRecords")
        .leftJoinAndSelect("medicalRecords.doctorsAssigned", "doctorsAssigned");
      particle = new QueryModifier(authzQuery, policy).eval();
      query.andWhere(particle.queryParticle, particle.params);
      expect(await query.getMany()).toEqual([]);
    });

    it("rewrites an eq policy with path of nested attribute", async () => {
      let authzQuery: AuthzQuery;
      let query: SelectQueryBuilder<Patient>;
      let particle: ModificationClause;

      // fixture
      let patient = new Patient();
      patient.id = 123;
      await connection.manager.save(patient);
      let accountant = new Accountant();
      accountant.id = 456;
      await connection.manager.save(accountant);
      let billingInfo = new BillingInfo();
      billingInfo.patient = patient;
      billingInfo.address = "address";
      billingInfo.accountant = accountant;
      await connection.manager.save(billingInfo);

      let policy = <Policy>{
        action: "view",
        resource: "patient:*:billingInfo",
        operation: {
          operator: "=",
          params: ["input.user.id", "context.patient.billingInfo.accountant.id"]
        }
      };
      authzQuery = <AuthzQuery>{
        data: {
          input: {
            user: { id: 456 }
          }
        },
        action: "view",
        target: "patient:*:billingInfo",
        attribute: "billingInfo"
      };

      query = connection
        .getRepository(Patient)
        .createQueryBuilder("patient")
        .leftJoinAndSelect("patient.billingInfo", "billingInfo")
        .leftJoinAndSelect("billingInfo.accountant", "accountant")
        .leftJoinAndSelect("patient.medicalRecords", "medicalRecords")
        .leftJoinAndSelect("medicalRecords.doctorsAssigned", "doctorsAssigned")
        .select("patient.id");
      particle = new QueryModifier(authzQuery, policy).eval();
      query.andWhere(particle.queryParticle, particle.params);
      expect(await query.getMany()).toEqual([patient]);
    });

    it("rewrites an inByPathNested policy", async () => {
      let authzQuery: AuthzQuery;
      let query: SelectQueryBuilder<Patient>;
      let particle: ModificationClause;

      // fixture setup
      let patient = new Patient();
      patient.id = 123;
      await connection.manager.save(patient);
      let doctor = new Doctor();
      doctor.id = 456;
      await connection.manager.save(doctor);
      let medicalRecord = new MedicalRecord();
      medicalRecord.patient = patient;
      medicalRecord.doctorsAssigned = [doctor];
      await connection.manager.save(medicalRecord);

      let policy = <Policy>{
        action: "view",
        resource: "patient:*:patientInfo",
        operation: {
          operator: "inByPathNested",
          params: ["input.user.id", "context.patient.medicalRecords.doctorsAssigned.id"]
        }
      };

      authzQuery = <AuthzQuery>{
        data: {
          input: {
            user: { id: 456 }
          }
        },
        action: "view",
        target: "patient:*:patientInfo",
        attribute: "patientInfo"
      };
      query = connection
        .getRepository(Patient)
        .createQueryBuilder("patient")
        .leftJoinAndSelect("patient.billingInfo", "billingInfo")
        .leftJoinAndSelect("billingInfo.accountant", "accountant")
        .leftJoinAndSelect("patient.medicalRecords", "medicalRecords")
        .leftJoinAndSelect("medicalRecords.doctorsAssigned", "doctorsAssigned")
        .select("patient.id");
      particle = new QueryModifier(authzQuery, policy).eval();
      query.andWhere(particle.queryParticle, particle.params);
      expect(await query.getMany()).toEqual([{ id: patient.id }]);

      authzQuery = <AuthzQuery>{};
      query = connection
        .getRepository(Patient)
        .createQueryBuilder("patient")
        .leftJoinAndSelect("patient.billingInfo", "billingInfo")
        .leftJoinAndSelect("billingInfo.accountant", "accountant")
        .leftJoinAndSelect("patient.medicalRecords", "medicalRecords")
        .leftJoinAndSelect("medicalRecords.doctorsAssigned", "doctorsAssigned")
        .select("patient.id");
      particle = new QueryModifier(authzQuery, policy).eval();
      query.andWhere(particle.queryParticle, particle.params);
      expect(await query.getMany()).toEqual([]);
    });
  });
});
