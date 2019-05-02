import { IPatientsService, PatientsServiceRequest } from "../../common/interfaces/patients.service";
import { Connection } from "typeorm";
import { Patient } from "../../entity/Patient";
import { UserContext } from "../../common/interfaces/authz";
import * as _ from "lodash";
import { AuthzQuery } from "../authz/vendors/authz.vendors";
import { MedicalRecord } from "../../entity/MedicalRecord";
import { BillingInfo } from "../../entity/BillingInfo";
import { entities } from "ormconfig";
import { User } from "../../entity/User";
import { Accountant } from "../../entity/Accountant";
import { Doctor } from "../../entity/Doctor";
import { getMockConnection } from "../../utils";

export class PatientsServiceMock implements IPatientsService {
  private mockConnection: Connection;
  private mockPatients: Patient[];

  async list(user: UserContext, includes?: string[]): Promise<Patient[]> {
    return this.mockPatients;
  }

  async detail(user: UserContext, patientId: number, includes?: string[]): Promise<Patient> {
    return _.find(this.mockPatients, patient => patient.id === patientId);
  }

  getConnection(): Connection {
    return this.mockConnection;
  }

  async onModuleInit(): Promise<void> {
    this.mockConnection = await getMockConnection(entities);
    await this.fixtureSetup();
    await this.getConnection().close();
  }

  translateRequestToAuthzQuery(request: PatientsServiceRequest): AuthzQuery[] {
    return [];
  }

  private async fixtureSetup() {
    const doctorUser = new User();
    doctorUser.name = "alice";
    await this.mockConnection.manager.save(doctorUser);

    const accountantUser = new User();
    accountantUser.name = "bob";
    await this.mockConnection.manager.save(accountantUser);

    const patientUser1 = new User();
    patientUser1.name = "carol";
    await this.mockConnection.manager.save(patientUser1);

    const patientUser2 = new User();
    patientUser2.name = "dan";
    await this.mockConnection.manager.save(patientUser2);

    const doctor = new Doctor();
    doctor.id = doctorUser.id;
    await this.mockConnection.manager.save(doctor);

    const accountant = new Accountant();
    accountant.id = accountantUser.id;
    await this.mockConnection.manager.save(accountant);

    const patient1 = new Patient();
    patient1.id = patientUser1.id;
    await this.mockConnection.manager.save(patient1);

    const patient2 = new Patient();
    patient2.id = patientUser2.id;
    patient2.medicalRecords = [];
    await this.mockConnection.manager.save(patient2);

    const medicalRecord1 = new MedicalRecord();
    medicalRecord1.doctorsAssigned = [];
    await this.mockConnection.manager.save(medicalRecord1);
    const medicalRecord2 = new MedicalRecord();
    await this.mockConnection.manager.save(medicalRecord2);

    const billingInfo = new BillingInfo();
    billingInfo.address = "patient's billing address";
    billingInfo.patient = patient2;
    await this.mockConnection.manager.save(billingInfo);

    patient2.medicalRecords.push(medicalRecord1);
    patient2.billingInfo = billingInfo;
    await this.mockConnection.manager.save(patient2);

    medicalRecord1.doctorsAssigned.push(doctor);
    await this.mockConnection.manager.save(medicalRecord1);
    billingInfo.accountant = accountant;
    await this.mockConnection.manager.save(billingInfo);

    this.mockPatients = [patient1, patient2];
  }
}
