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

  it("GET /patients: services html page", async () => {
    const expectedSendParam = ["list.html", { root: "public" }];
    let resSendParams = null;
    await client.servicePatientPage(null, { sendFile: (...args) => (resSendParams = args) }, null);
    expect(resSendParams).toEqual(expectedSendParam);
  });
});
