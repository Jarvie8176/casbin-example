import { OnModuleInit } from "@nestjs/common";
import { UserIdentity } from "./authz";
import { Patient } from "../../entity/Patient";
import { AuthzQuery } from "../../service/authz/vendors/authz.vendors";

export interface IPatientsService extends OnModuleInit {
  list(user: UserIdentity, includes?: string[]): Promise<Patient[]>;
  detail(user: UserIdentity, patientId: number, includes?: string[]): Promise<Patient>;
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
