import { Test } from "@nestjs/testing";
import * as _ from "lodash";
import { PatientsController } from "./patients.controller";
import { PatientsService } from "../service/patients/patients.service";
import { Patient } from "../entity/Patient";
import { getMockConnection } from "../utils";
import { Connection } from "typeorm";
import { entities } from "ormconfig";
import { BillingInfo } from "../entity/BillingInfo";
import { MedicalRecord } from "../entity/MedicalRecord";
import { User } from "../entity/User";
import { Doctor } from "../entity/Doctor";
import { Accountant } from "../entity/Accountant";
import { metadata } from "../common/metadata/api.module.metadata";

describe("PatientsController", () => {
  let patientsController: PatientsController;
  let patientsService: PatientsService;
  let mockConnection: Connection;

  let mockPatients: Patient[];

  beforeEach(async () => {
    const module = await Test.createTestingModule(metadata).compile();

    patientsController = module.get("PatientsController");
    patientsService = module.get("PatientsService");

    mockConnection = await getMockConnection(entities);
    jest.spyOn(patientsService, "getConnection").mockImplementation(() => mockConnection);

    await fixtureSetup();
  });

  afterEach(async () => mockConnection.close());

  it("PatientsController:list(): returns a list of mock patients", async () => {
    jest.spyOn(patientsService, "list").mockImplementation(async () => mockPatients);
    expect(await patientsController.list()).toEqual(mockPatients);
  });

  it("PatientsController:list(): returns details of mock patients", async () => {
    jest
      .spyOn(patientsService, "detail")
      .mockImplementation(async id => _.find(mockPatients, patient => id === patient.id));
    expect(await patientsController.detail(mockPatients[0].id)).toEqual(mockPatients[0]);
    expect(await patientsController.detail(mockPatients[1].id)).toEqual(mockPatients[1]);
  });

  it("PatientsController:list(): returns only patientInfo in the list of mock patients", async () => {
    await mockConnection.getRepository(Patient).save(mockPatients);
    const patientFound = await patientsController.list("patientInfo");
    expect(patientFound).toEqual([{ id: mockPatients[0].id }, { id: mockPatients[1].id }]);
  });

  it("PatientsController:detail(): returns only patientInfo in the detail of mock patients", async () => {
    await mockConnection.getRepository(Patient).save(mockPatients);
    const patientFound = await patientsController.detail(mockPatients[0].id, "patientInfo");
    expect(patientFound).toEqual({ id: mockPatients[0].id });
  });

  it("PatientsController:detail(): returns only patientInfo and billingInfo in the detail of mock patients", async () => {
    await mockConnection.getRepository(Patient).save(mockPatients);
    const patientFound = await patientsController.detail(mockPatients[1].id, "billingInfo");
    expect(patientFound).toEqual({
      id: mockPatients[1].id,
      billingInfo: {
        id: mockPatients[1].billingInfo.id,
        address: mockPatients[1].billingInfo.address
      }
    });
  });

  it("PatientsController:detail(): returns only patientInfo, billingInfo and medicalRecords in the detail of mock patients", async () => {
    await mockConnection.getRepository(Patient).save(mockPatients);
    const patientFound = await patientsController.detail(mockPatients[1].id, "patientInfo,billingInfo,medicalRecords");
    expect(patientFound).toEqual({
      id: mockPatients[1].id,
      billingInfo: {
        id: mockPatients[1].billingInfo.id,
        address: mockPatients[1].billingInfo.address
      },
      medicalRecords: [
        {
          id: mockPatients[1].medicalRecords[0].id,
          createdAt: mockPatients[1].medicalRecords[0].createdAt
        }
      ]
    });
  });

  it("PatientsController:detail(): returns all the detail of mock patients", async () => {
    await mockConnection.getRepository(Patient).save(mockPatients);
    const patientFound = await patientsController.detail(mockPatients[1].id);
    expect(patientFound).toEqual({
      id: mockPatients[1].id,
      billingInfo: {
        id: mockPatients[1].billingInfo.id,
        address: mockPatients[1].billingInfo.address
      },
      medicalRecords: [
        {
          id: mockPatients[1].medicalRecords[0].id,
          createdAt: mockPatients[1].medicalRecords[0].createdAt
        }
      ]
    });
  });

  async function fixtureSetup() {
    const doctorUser = new User();
    doctorUser.name = "alice";
    await mockConnection.manager.save(doctorUser);

    const accountantUser = new User();
    accountantUser.name = "bob";
    await mockConnection.manager.save(accountantUser);

    const patientUser1 = new User();
    patientUser1.name = "carol";
    await mockConnection.manager.save(patientUser1);

    const patientUser2 = new User();
    patientUser2.name = "dan";
    await mockConnection.manager.save(patientUser2);

    const doctor = new Doctor();
    doctor.id = doctorUser.id;
    await mockConnection.manager.save(doctor);

    const accountant = new Accountant();
    accountant.id = accountantUser.id;
    await mockConnection.manager.save(accountant);

    const patient1 = new Patient();
    patient1.id = patientUser1.id;
    await mockConnection.manager.save(patient1);

    const patient2 = new Patient();
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

    mockPatients = [patient1, patient2];
  }
});
