import { Test } from "@nestjs/testing";
import * as request from "supertest";
import * as cookieParser from "cookie-parser";
import { entities } from "ormconfig";
import { User } from "../../src/entity/User";
import { Doctor } from "../../src/entity/Doctor";
import { Accountant } from "../../src/entity/Accountant";
import { Patient } from "../../src/entity/Patient";
import { MedicalRecord } from "../../src/entity/MedicalRecord";
import { BillingInfo } from "../../src/entity/BillingInfo";
import { Connection } from "typeorm";
import { PatientsService } from "../../src/service/patients/patients.service";
import { getMockConnection } from "../../src/utils";
import { metadata } from "../../src/common/metadata/app.module.metadata";
import { INestApplication } from "@nestjs/common";
import { UserContext } from "../../src/common/interfaces/authz";

describe("Patients", () => {
  let app: INestApplication;
  let mockConnection: Connection;
  let patientsService: PatientsService;

  let doctorUser: User;
  let accountantUser: User;
  let patientUser1: User;
  let patientUser2: User;
  let patients: Patient[];

  beforeAll(async () => {
    mockConnection = await getMockConnection(entities);
    await fixtureSetup();

    const apiModule = await Test.createTestingModule(metadata).compile();
    patientsService = apiModule.get("PatientsService");
    await patientsService.onModuleInit();
    jest.spyOn<any, string>(patientsService, "getConnection").mockImplementation(() => mockConnection);

    const appModule = await Test.createTestingModule(metadata)
      .overrideProvider(PatientsService)
      .useValue(patientsService)
      .compile();
    app = appModule.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => mockConnection.close());

  describe("usage", () => {
    beforeAll(async () => {
      jest.spyOn<any, string>(patientsService, "getAuthzEnabled").mockImplementation(() => false);
    });

    it("GET /patients/?fields=patientInfo: returns only patientInfo in the list of mock patients", async () => {
      const response = await request(app.getHttpServer())
        .get("/patients/?fields=patientInfo")
        .expect(200);
      expect(response.body).toEqual({ data: [{ id: patients[0].id }, { id: patients[1].id }] });
    });

    it("GET /patients/:id/?fields=: returns all the detail of mock patients", async () => {
      const response = await request(app.getHttpServer())
        .get(`/patients/${patients[1].id}/`)
        .expect(200);
      expect(response.body).toEqual({
        data: {
          id: patients[1].id,
          billingInfo: {
            id: patients[1].billingInfo.id,
            address: patients[1].billingInfo.address
          },
          medicalRecords: [
            {
              id: patients[1].medicalRecords[0].id,
              createdAt: patients[1].medicalRecords[0].createdAt
            }
          ]
        }
      });
    });

    it("GET /patients/:id/?fields=patientInfo: returns only patientInfo in the detail of mock patients", async () => {
      const response = await request(app.getHttpServer())
        .get(`/patients/${patients[0].id}/?fields=patientInfo`)
        .expect(200);
      expect(response.body).toEqual({ data: { id: patients[0].id } });
    });

    it("GET /patients/:id/?fields=billingInfo: returns only patientInfo and billingInfo in the detail of mock patients", async () => {
      const response = await request(app.getHttpServer())
        .get(`/patients/`)
        .expect(200);
      expect(response.body).toEqual({
        data: patients
      });
    });

    it("GET /patients/:id/?fields=billingInfo,medicalRecords: returns only patientInfo, billingInfo and medicalRecords in the detail of mock patients", async () => {
      const response = await request(app.getHttpServer())
        .get(`/patients/${patients[1].id}/?fields=billingInfo,medicalRecords`)
        .expect(200);
      expect(response.body).toEqual({
        data: {
          id: patients[1].id,
          billingInfo: {
            id: patients[1].billingInfo.id,
            address: patients[1].billingInfo.address
          },
          medicalRecords: [
            {
              id: patients[1].medicalRecords[0].id,
              createdAt: patients[1].medicalRecords[0].createdAt
            }
          ]
        }
      });
    });

    it("GET /patients/:id/: id must be an int", async () => {
      await request(app.getHttpServer())
        .get(`/patients/A/?fields=billingInfo,medicalRecords`)
        .expect(400);
    });
  });

  describe("authorization", () => {
    beforeAll(async () => {
      jest.spyOn<any, string>(patientsService, "getAuthzEnabled").mockImplementation(() => true);
    });

    it("GET /patients: log in as admin, lists all patients", async () => {
      const context = <UserContext>{ id: 999, privilegeLevel: 999, persona: [{ type: "admin", id: 999 }] };
      await request(app.getHttpServer())
        .get(`/patients/${patients[1].id}/?fields=billingInfo,medicalRecords`)
        .set("Cookie", [`context=${JSON.stringify(context)}`])
        .expect(200);
    });

    // it("GET /patients: log in as no one, lists nothing", async () => {
    //   const context = {};
    //   const response = await request(app.getHttpServer())
    //     .get(`/patients/`)
    //     .set("Cookie", [`context=${JSON.stringify(context)}`])
    //     .expect(200);
    //   expect(response.body).toEqual({ data: [] });
    // });

    // it("GET /patients: log in as doctor, lists available patients", async () => {
    //   expect(true).toEqual(false);
    // });
    //
    // it("GET /patients: log in as patient, lists own details", async () => {
    //   expect(true).toEqual(false);
    // });

    it("GET /patients/:id: log in as patient, views own details", async () => {
      const context = <UserContext>{ id: patientUser1.id, persona: [{ type: "patient", id: patientUser1.id }] };
      const response = await request(app.getHttpServer())
        .get(`/patients/${patients[0].id}/?fields=billingInfo,medicalRecords`)
        .set("Cookie", [`context=${JSON.stringify(context)}`])
        .expect(200);
      expect(response.body).toEqual({ data: patients[0] });
    });

    it("GET /patients/:id: log in as doctor, views accessible patient medical records", async () => {
      const context = <UserContext>{ id: doctorUser.id, persona: [{ type: "doctor", id: doctorUser.id }] };
      const response = await request(app.getHttpServer())
        .get(`/patients/${patients[1].id}/?fields=medicalRecords`)
        .set("Cookie", [`context=${JSON.stringify(context)}`])
        .expect(200);
      expect(response.body).toEqual({
        data: {
          id: patients[1].id,
          medicalRecords: patients[1].medicalRecords
        }
      });
    });

    it("GET /patients/:id: log in as doctor, views accessible patient billingInfo", async () => {
      const context = <UserContext>{ id: doctorUser.id, persona: [{ type: "doctor", id: doctorUser.id }] };
      await request(app.getHttpServer())
        .get(`/patients/${patients[1].id}/?fields=billingInfo`)
        .set("Cookie", [`context=${JSON.stringify(context)}`])
        .expect(403);
    });

    it("GET /patients/:id: log in as doctor, views non-accessible patient details", async () => {
      const context = <UserContext>{ id: doctorUser.id, persona: [{ type: "doctor", id: doctorUser.id }] };
      await request(app.getHttpServer())
        .get(`/patients/${patients[1].id}/?fields=billingInfo,medicalRecords`)
        .set("Cookie", [`context=${JSON.stringify(context)}`])
        .expect(403);
    });
  });

  async function fixtureSetup() {
    doctorUser = new User();
    doctorUser.name = "alice";
    await mockConnection.manager.save(doctorUser);

    accountantUser = new User();
    accountantUser.name = "bob";
    await mockConnection.manager.save(accountantUser);

    patientUser1 = new User();
    patientUser1.name = "carol";
    await mockConnection.manager.save(patientUser1);

    patientUser2 = new User();
    patientUser2.name = "dan";
    await mockConnection.manager.save(patientUser2);

    const doctor = new Doctor();
    doctor.id = doctorUser.id;
    await mockConnection.manager.save(doctor);

    const accountant = new Accountant();
    accountant.id = accountantUser.id;
    await mockConnection.manager.save(accountant);

    let patient1 = new Patient();
    patient1.id = patientUser1.id;
    await mockConnection.manager.save(patient1);

    let patient2 = new Patient();
    patient2.id = patientUser2.id;
    patient2.medicalRecords = [];
    await mockConnection.manager.save(patient2);

    const medicalRecord1 = new MedicalRecord();
    medicalRecord1.doctorsAssigned = [];
    await mockConnection.manager.save(medicalRecord1);
    const medicalRecord2 = new MedicalRecord();
    await mockConnection.manager.save(medicalRecord2);

    const billingInfo = new BillingInfo();
    billingInfo.address = "patient's billing address";
    billingInfo.patient = patient2;
    await mockConnection.manager.save(billingInfo);

    patient2.medicalRecords.push(medicalRecord1);
    patient2.billingInfo = billingInfo;
    await mockConnection.manager.save(patient2);

    medicalRecord1.doctorsAssigned.push(doctor);
    await mockConnection.manager.save(medicalRecord1);
    billingInfo.accountant = accountant;
    await mockConnection.manager.save(billingInfo);

    patient1 = await mockConnection.manager.getRepository(Patient).findOne({
      relations: ["billingInfo", "medicalRecords"],
      where: { id: patient1.id }
    });
    patient2 = await mockConnection.manager.getRepository(Patient).findOne({
      relations: ["billingInfo", "medicalRecords"],
      where: { id: patient2.id }
    });

    // load auto populated data
    patients = [JSON.parse(JSON.stringify(patient1)), JSON.parse(JSON.stringify(patient2))];
  }
});