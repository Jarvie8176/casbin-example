import * as express from "express";
import { Response } from "express-serve-static-core";

export class Client {
  readonly router = express.Router();

  constructor() {
    this.routerSetup();
  }

  private routerSetup(): void {
    this.router.get("/", (req, res, next) => this.servePatientPage(req, res, next));
  }

  // exposed for testing
  servePatientPage(req, res, next) {
    return this.sendPatientPage(res);
  }

  private sendPatientPage(res: Response) {
    res.sendFile("list.html", { root: "public" });
  }
}
