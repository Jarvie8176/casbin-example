import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { createConnection, getConnection } from "typeorm";
import { Patient } from "./entity/Patient";
import { BillingInfo } from "./entity/BillingInfo";
import { Accountant } from "./entity/Accountant";
import { Doctor } from "./entity/Doctor";
import { User } from "./entity/User";
import { MedicalRecord } from "./entity/MedicalRecord";
import * as cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  await createConnection();
  await seeding();
  await app.listen(3000);
}
bootstrap().catch(err => console.error(err));

async function seeding() {
  const connection = getConnection();

  const doctorUser = new User();
  doctorUser.name = "alice";
  await connection.manager.save(doctorUser);

  const accountantUser = new User();
  accountantUser.name = "bob";
  await connection.manager.save(accountantUser);

  const patientUser1 = new User();
  patientUser1.name = "carol";
  await connection.manager.save(patientUser1);

  const patientUser2 = new User();
  patientUser2.name = "dan";
  await connection.manager.save(patientUser2);

  const doctor = new Doctor();
  doctor.id = doctorUser.id;
  await connection.manager.save(doctor);

  const accountant = new Accountant();
  accountant.id = accountantUser.id;
  await connection.manager.save(accountant);

  const patient1 = new Patient();
  patient1.id = patientUser1.id;
  await connection.manager.save(patient1);

  const patient2 = new Patient();
  patient2.id = patientUser2.id;
  patient2.medicalRecords = [];
  await connection.manager.save(patient2);

  const medicalRecord1 = new MedicalRecord();
  medicalRecord1.doctorsAssigned = [];
  await connection.manager.save(medicalRecord1);
  const medicalRecord2 = new MedicalRecord();
  await connection.manager.save(medicalRecord2);

  const billingInfo = new BillingInfo();
  billingInfo.address = "patient's billing address";
  billingInfo.patient = patient2;
  await connection.manager.save(billingInfo);

  patient2.medicalRecords.push(medicalRecord1);
  patient2.billingInfo = billingInfo;
  await connection.manager.save(patient2);

  medicalRecord1.doctorsAssigned.push(doctor);
  await connection.manager.save(medicalRecord1);
  billingInfo.accountant = accountant;
  await connection.manager.save(billingInfo);
}
