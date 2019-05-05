import { Test } from "@nestjs/testing";
import { metadata as apiMetadata } from "../../../src/common/metadata/api.module.metadata";
import { metadata as appMetadata } from "../../../src/common/metadata/app.module.metadata";
import { Client } from "../../../src/client/client";
import { UserIdentity } from "../../../src/common/interfaces/authz";
import * as request from "supertest";
import { PatientsService } from "../../../src/service/patients/patients.service";
import { join } from "path";
import * as cookieParser from "cookie-parser";

describe("e2e: client pages", () => {
  let app;
  let server;
  let client;
  let patientsService: PatientsService;

  let patientIdCaptured: number;
  let fieldsCaptured: string;
  let identityCaptured: string;

  beforeAll(async () => {
    const tempModule = await Test.createTestingModule(apiMetadata).compile();
    patientsService = tempModule.get("PatientsService");
    jest.spyOn(patientsService, "list").mockImplementation(
      async (user: UserIdentity, includes?: string[]): Promise<any> => {
        includes = includes || [];
        fieldsCaptured = includes.join(",");
        identityCaptured = JSON.stringify(user);
        return "test data";
      }
    );
    jest.spyOn(patientsService, "detail").mockImplementation(
      async (user: UserIdentity, patientId: number, includes?: string[]): Promise<any> => {
        includes = includes || [];
        patientIdCaptured = patientId;
        fieldsCaptured = includes.join(",");
        identityCaptured = JSON.stringify(user);
        return "test data";
      }
    );
    const appModule = await Test.createTestingModule(appMetadata)
      .overrideProvider(PatientsService)
      .useValue(patientsService)
      .compile();
    app = await appModule.createNestApplication();
    client = new Client();
    app.use(cookieParser());
    app.setBaseViewsDir(join(__dirname, "..", "views"));
    app.setViewEngine("hbs");
    app.use("/patients", client.router);
    server = await app.listen(3000);
  });

  afterAll(async () => {
    await server.close();
  });

  it("GET /patients: renders data as fetched from the api", async () => {
    jest.spyOn<any, string>(client, "renderPatientList").mockImplementation(async (res: any, data) => res.send(data));

    const fields = "billingInfo,medicalRecords";
    const identity = <UserIdentity>{ id: 999, privilegeLevel: 999, persona: [{ type: "admin", id: 999 }] };
    const data = await request(app.getUnderlyingHttpServer())
      .get(`/patients?fields=${fields}`)
      .set("Cookie", `identity=${JSON.stringify(identity)}`)
      .expect(200);
    expect(data.body).toEqual({ data: "test data" });
    expect(fieldsCaptured).toEqual(fields);
    expect(identityCaptured).toEqual(JSON.stringify(identity));
  });

  it("GET /patients/:id/: renders data as fetched from the api", async () => {
    jest.spyOn<any, string>(client, "renderPatientDetail").mockImplementation(async (res: any, data) => res.send(data));

    const patientId = 123;
    const fields = "billingInfo,medicalRecords";
    const identity = <UserIdentity>{ id: 999, privilegeLevel: 999, persona: [{ type: "admin", id: 999 }] };
    const data = await request(app.getUnderlyingHttpServer())
      .get(`/patients/${patientId}?fields=${fields}`)
      .set("Cookie", `identity=${JSON.stringify(identity)}`)
      .expect(200);
    expect(data.body).toEqual({ data: "test data" });
    expect(patientIdCaptured).toEqual(patientId);
    expect(fieldsCaptured).toEqual(fields);
    expect(identityCaptured).toEqual(JSON.stringify(identity));
  });
});
