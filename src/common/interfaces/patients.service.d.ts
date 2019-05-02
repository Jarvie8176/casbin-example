import { OnModuleInit } from "@nestjs/common";
import { UserContext } from "./authz";
import { Patient } from "../../entity/Patient";
import { Connection } from "typeorm";
import { AuthzQuery } from "../../service/authz/vendors/authz.vendors";

export interface IPatientsService extends OnModuleInit {
  list(user: UserContext, includes?: string[]): Promise<Patient[]>;
  detail(user: UserContext, patientId: number, includes?: string[]): Promise<Patient>;
  getConnection(): Connection;
  translateRequestToAuthzQuery(request: PatientsServiceRequest): AuthzQuery[];
}

export interface PatientsServiceRequest {
  subject: {};
  target: {
    patientId: number;
    action: string;
    attributes: string[];
  };
}
