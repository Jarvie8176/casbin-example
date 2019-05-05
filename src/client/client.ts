import * as express from "express";
import * as _ from "lodash";
import axios from "axios";
import { Response } from "express-serve-static-core";

export class Client {
  readonly router = express.Router();

  private static readonly API_URL = "http://localhost:3000/api";

  constructor() {
    this.routerSetup();
  }

  private routerSetup(): void {
    this.router.get("/:id", (req, res, next) => this.servePatientDetail(req, res, next));
    this.router.get("/", (req, res, next) => this.servePatientList(req, res, next));
  }

  // exposed for testing
  servePatientList(req, res, next) {
    return Promise.resolve()
      .then(async () => {
        const fields = _.get(req, "query.fields");
        const identity = _.get(req, "cookies.identity");
        const data = (await this.fetchPatientList(fields, identity)).data;
        return this.renderPatientList(res, data);
      })
      .catch(next);
  }

  // exposed for testing
  servePatientDetail(req, res, next) {
    return Promise.resolve()
      .then(async () => {
        const patientId = _.get(req, "params.id");
        const fields = _.get(req, "query.fields");
        const identity = _.get(req, "cookies.identity");
        const data = (await this.fetchPatientDetail(patientId, fields, identity)).data;
        return this.renderPatientDetail(res, data);
      })
      .catch(next);
  }

  private fetchPatientList(fields?: string, identity?: string) {
    return axios.get(`${Client.API_URL}/patients?fields=${fields}`, { headers: { identity: identity } });
  }

  private fetchPatientDetail(patientId: number, fields?: string, identity?: string) {
    return axios.get(`${Client.API_URL}/patients/${patientId}?fields=${fields}`, { headers: { identity: identity } });
  }

  private renderPatientList(res: Response, data: any) {
    res.render("index", data);
  }

  private renderPatientDetail(res: Response, data: any) {
    res.render("details", data);
  }
}
