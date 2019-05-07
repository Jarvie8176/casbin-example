import { NestApplication, NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { createConnection, getConnection } from "typeorm";
import { Patient } from "./entity/Patient";
import { BillingInfo } from "./entity/BillingInfo";
import { Accountant } from "./entity/Accountant";
import { Doctor } from "./entity/Doctor";
import { User } from "./entity/User";
import { MedicalRecord } from "./entity/MedicalRecord";
import * as cookieParser from "cookie-parser";
// @ts-ignore
import { Promise } from "bluebird";
import { join } from "path";
import { Client } from "src/client/client";

bootstrap().catch(err => console.error(err));

async function bootstrap() {
  const app = await NestFactory.create<NestApplication>(AppModule);
  await setup(app, new Client());
  await createConnection();
  await seeding();
  await app.listen(process.env.PORT || 3000);
}

export async function setup(app: NestApplication, client) {
  app.use(cookieParser());
  app.useStaticAssets(join(__dirname, "..", "public"));
  app.use("/", client.router);
}

async function seeding() {
  const connection = getConnection();

  const doctorUser1 = new User();
  doctorUser1.name = "alice";
  const doctorUser2 = new User();
  const accountantUser1 = new User();
  accountantUser1.name = "bob";
  const accountantUser2 = new User();
  const patientUser1 = new User();
  patientUser1.name = "carol";
  const patientUser2 = new User();
  patientUser2.name = "dan";
  const patientUser3 = new User();

  await Promise.each(
    [doctorUser1, doctorUser2, accountantUser1, accountantUser2, patientUser1, patientUser2, patientUser3],
    u => connection.manager.save(u)
  );

  const doctor1 = new Doctor();
  doctor1.id = doctorUser1.id;
  await connection.manager.save(doctor1);

  const doctor2 = new Doctor();
  doctor2.id = doctorUser2.id;
  await connection.manager.save(doctor2);

  const accountant1 = new Accountant();
  accountant1.id = accountantUser1.id;
  await connection.manager.save(accountant1);

  const accountant2 = new Accountant();
  accountant2.id = accountantUser2.id;
  await connection.manager.save(accountant2);

  const patient1 = new Patient();
  patient1.id = patientUser1.id;
  await connection.manager.save(patient1);

  const patient2 = new Patient();
  patient2.id = patientUser2.id;
  patient2.medicalRecords = [];
  await connection.manager.save(patient2);

  const patient3 = new Patient();
  patient3.id = patientUser3.id;
  patient3.medicalRecords = [];
  await connection.manager.save(patient3);

  const medicalRecords = [new MedicalRecord(), new MedicalRecord(), new MedicalRecord()];
  // await Promise.each(medicalRecords, mr => {
  //   mr.doctorsAssigned = [];
  //   return connection.manager.save(mr);
  // });
  medicalRecords[0].patient = patient1;
  medicalRecords[0].doctorsAssigned = [doctor1, doctor2];
  medicalRecords[1].patient = patient1;
  medicalRecords[1].doctorsAssigned = [doctor1];
  medicalRecords[2].patient = patient2;
  medicalRecords[2].doctorsAssigned = [doctor2];
  await Promise.each(medicalRecords, mr => connection.manager.save(mr));

  const billingInfo1 = new BillingInfo();
  billingInfo1.address = "billing address 0";
  billingInfo1.patient = patient1;
  billingInfo1.accountant = accountant1;
  const billingInfo2 = new BillingInfo();
  billingInfo2.address = "billing address 1";
  billingInfo2.patient = patient2;
  billingInfo2.accountant = accountant2;

  await Promise.each([billingInfo1, billingInfo2], bi => connection.manager.save(bi));
}
