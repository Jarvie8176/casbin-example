import { ClassSerializerInterceptor, Inject, Injectable, OnModuleInit, UseInterceptors } from "@nestjs/common";
import { Connection, getConnection } from "typeorm";
import { Patient } from "../../entity/Patient";
import { BillingInfo } from "../../entity/BillingInfo";
import { MedicalRecord } from "../../entity/MedicalRecord";
import { AuthorizationService } from "../authz/authz.service";
import { IPatientsService, PatientsServiceRequest } from "../../common/interfaces/patients.service";
import { AuthzQuery } from "../authz/vendors/authz.vendors";
import * as _ from "lodash";
import { Unauthorized } from "../../common/errors";
import { UserContext } from "../../common/interfaces/authz";
import { getMockConnection } from "../../utils";

@Injectable()
export class PatientsService implements IPatientsService {
  static readonly InclCandidates = {
    patientInfo: (connection: Connection) =>
      connection.getMetadata(Patient).ownColumns.map(col => `p.${col.propertyName}`),
    billingInfo: (connection: Connection) =>
      connection.getMetadata(BillingInfo).ownColumns.map(col => `b.${col.propertyName}`),
    medicalRecords: (connection: Connection) =>
      connection.getMetadata(MedicalRecord).ownColumns.map(col => `mr.${col.propertyName}`)
  };

  constructor(
    @Inject("AuthzService") private readonly authzService: AuthorizationService,
    @Inject("AUTHZ_ENABLE") private readonly authzEnabled: boolean
  ) {}

  async onModuleInit(): Promise<void> {
    await this.authzService.onModuleInit();
  }

  static readonly DefaultCandidates = ["patientInfo"];

  @UseInterceptors(ClassSerializerInterceptor)
  async list(user: UserContext, includes?: string[]): Promise<Patient[]> {
    includes = this.filterColumns(includes);
    return this.getConnection()
      .getRepository(Patient)
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.billingInfo", "b")
      .leftJoinAndSelect("p.medicalRecords", "mr")
      .select(includes)
      .getMany();
  }

  @UseInterceptors(ClassSerializerInterceptor)
  async detail(user: UserContext, patientId: number, includes?: string[]): Promise<Patient> {
    let request: PatientsServiceRequest = {
      subject: null,
      target: {
        patientId: 1,
        action: "view",
        attributes: ["patientInfo", "billingInfo"]
      }
    };

    includes = this.filterColumns(includes);

    // authz
    if (this.authzEnabled) {
      let decision: boolean = !_.includes(
        await Promise.all(
          _.map(this.translateRequestToAuthzQuery(request), authzQuery => this.authzService.getDecision(authzQuery))
        ),
        false
      );

      if (!decision) throw new Unauthorized();
    }

    return this.getConnection()
      .getRepository(Patient)
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.billingInfo", "b")
      .leftJoinAndSelect("p.medicalRecords", "mr")
      .select(includes)
      .where("p.id = :id", { id: patientId })
      .getOne();
  }

  private filterColumns(includes?: string[]): string[] {
    if (!_.isArray(includes) || _.isEmpty(includes)) {
      // include all by default
      includes = _.keys(PatientsService.InclCandidates);
    } else {
      includes = _.union(includes, PatientsService.DefaultCandidates);
    }
    return _.chain(includes)
      .map(attr => PatientsService.InclCandidates[attr])
      .filter(i => !_.isNil(i))
      .map(cb => cb(this.getConnection()))
      .flatten()
      .value();
  }

  // exposed for testing
  getConnection(): Connection {
    return getConnection();
  }

  // exposed for testing
  translateRequestToAuthzQuery(request: PatientsServiceRequest): AuthzQuery[] {
    const action = request.target.action;
    const patientId = request.target.patientId || "*";
    const resources = _.map(request.target.attributes, attr => `patient:${patientId}:${attr}`);

    return _.map(resources, resource => ({
      input: request.subject,
      action: action,
      target: resource
    }));
  }
}


