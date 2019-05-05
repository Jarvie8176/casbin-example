import { Client } from "./client";
import * as express from "express";
import { Express } from "express";

describe("client pages", () => {
  let app: Express;
  let client: Client;

  beforeAll(() => {
    app = express();
    client = new Client();
    app.use(client.router);
  });

  it("GET /patients: renders data as fetched from the api", async () => {
    jest.spyOn<any, string>(client, "fetchPatientList").mockImplementation(() => ({ data: "data" }));
    jest.spyOn<any, string>(client, "renderPatientList").mockImplementation((res, data) => data);
    expect(await client.servePatientList(null, null, null)).toEqual("data");
  });
  it("GET /patients/:id/: renders data as fetched from the api", async () => {
    jest.spyOn<any, string>(client, "fetchPatientDetail").mockImplementation(() => ({ data: "data" }));
    jest.spyOn<any, string>(client, "renderPatientDetail").mockImplementation((res, data) => data);
    expect(await client.servePatientDetail(null, null, null)).toEqual("data");
  });
});
