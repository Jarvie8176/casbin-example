import * as express from "express";
import { Response } from "express-serve-static-core";

export class Client {
  readonly router = express.Router();

  constructor() {
    this.routerSetup();
  }

  private routerSetup(): void {
    this.router.get("/", (req, res, next) => this.servicePatientPage(req, res, next));
  }

  // exposed for testing
  servicePatientPage(req, res, next) {
    return this.sendPatientPage(res);
  }

  private sendPatientPage(res: Response) {
    res.sendFile("list.html", { root: "public" });
  }
}
