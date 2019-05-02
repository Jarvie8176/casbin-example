import { Test } from "@nestjs/testing";
import * as _ from "lodash";
import { Patient } from "../entity/Patient";
import { PatientsController } from "./patients.controller";
import { PatientsServiceMock } from "../service/patients/patients.service.mock";
import { metadata } from "../common/metadata/api.module.metadata";

describe("PatientsController", () => {
  let patientsController: PatientsController;
  let mockPatients: Patient[] = [];

  beforeEach(async () => {
    const patientsServiceMock = new PatientsServiceMock();
    await patientsServiceMock.onModuleInit();
    mockPatients = await patientsServiceMock.list(null, null);

    const module = await Test.createTestingModule(metadata).compile();
    patientsController = module.get("PatientsController");
    jest.spyOn<any, string>(patientsController, "getPatientsService").mockImplementation(() => patientsServiceMock);
  });

  it("PatientsController:list(): returns a list of mock patients", async () => {
    expect(await patientsController.list()).toEqual(mockPatients);
  });

  it("PatientsController:detail(): returns details of mock patients", async () => {
    expect(await patientsController.detail(mockPatients[0].id)).toEqual(mockPatients[0]);
    expect(await patientsController.detail(mockPatients[1].id)).toEqual(mockPatients[1]);
  });
});
