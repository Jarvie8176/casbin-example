import { Test } from "@nestjs/testing";
import { entities } from "ormconfig";
import { Patient } from "../entity/Patient";
import { PatientsController } from "./patients.controller";
import { metadata } from "../common/metadata/api.module.metadata";
import { getMockConnection } from "../utils";
import { PatientsService } from "../service/patients/patients.service";
import { User } from "../entity/User";
import { Doctor } from "../entity/Doctor";
import { Accountant } from "../entity/Accountant";
import { MedicalRecord } from "../entity/MedicalRecord";
import { BillingInfo } from "../entity/BillingInfo";
import { Connection } from "typeorm";
import { ForbiddenException } from "@nestjs/common";

describe("PatientsController", () => {
  let patientsController: PatientsController;
  let patientsService: PatientsService;
  let mockConnection: Connection;

  let doctorUser: User;
  let accountantUser: User;
  let patientUser1: User;
  let patientUser2: User;
  let patients: Patient[];

  beforeAll(async () => {
    mockConnection = await getMockConnection(entities);
    await fixtureSetup();
  });

  describe("data & output", () => {
    beforeAll(async () => {
      const module = await Test.createTestingModule(metadata)
        .overrideProvider("AUTHZ_ENABLE")
        .useValue(false)
        .compile();
      patientsController = module.get("PatientsController");
      patientsService = module.get("PatientsService");
      await patientsService.onModuleInit();
      jest.spyOn<any, string>(patientsService, "getConnection").mockImplementation(() => mockConnection);
    });

    it("PatientsController:list(): returns a list of mock patients", async () => {
      expect(await patientsController.list()).toEqual(patients);
    });

    it("PatientsController:detail(): returns details of mock patients", async () => {
      await expect(patientsController.detail(patients[0].id)).resolves.toEqual(patients[0]);
      await expect(patientsController.detail(patients[1].id)).resolves.toEqual(patients[1]);
    });
  });

  describe("authz", () => {
    beforeAll(async () => {
      const module = await Test.createTestingModule(metadata)
        .overrideProvider("AUTHZ_ENABLE")
        .useValue(true)
        .compile();
      patientsController = module.get("PatientsController");
      patientsService = module.get("PatientsService");
      await patientsService.onModuleInit();
      jest.spyOn<any, string>(patientsService, "getConnection").mockImplementation(() => mockConnection);
    });

    it("admin user lists all patients", async () => {
      expect(await patientsController.list(null, JSON.stringify({ id: 999, privilegeLevel: 999 }))).toEqual(patients);
    });
    it("doctor user views a patient's billingInfo", async () => {
      await expect(
        patientsController.detail(patients[0].id, "billingInfo", JSON.stringify(doctorUser))
      ).rejects.toThrow(ForbiddenException);
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

    // load fixture data
    patients = [patient1, patient2];
  }
});
