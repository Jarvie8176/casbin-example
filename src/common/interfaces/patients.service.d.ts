import { OnModuleInit } from "@nestjs/common";
import { UserContext } from "./authz";
import { Patient } from "../../entity/Patient";
import { AuthzQuery } from "../../service/authz/vendors/authz.vendors";

export interface IPatientsService extends OnModuleInit {
  list(user: UserContext, includes?: string[]): Promise<Patient[]>;
  detail(user: UserContext, patientId: number, includes?: string[]): Promise<Patient>;
  translateRequestToAuthzQuery(request: PatientsServiceRequest): AuthzQuery[];
}

export interface PatientsServiceRequest {
  subject: {
    user: {
      id: number;
      privilegeLevel?: number;
    };
    patient?: {};
    doctor?: {};
    accountant?: {};
    admin?: {};
  };
  target: {
    patient: Patient;
    action: string;
    attributes: string[];
  };
}
