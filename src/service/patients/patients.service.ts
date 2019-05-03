import { ClassSerializerInterceptor, ForbiddenException, Inject, Injectable, UseInterceptors } from "@nestjs/common";
import { Connection, getConnection } from "typeorm";
import { Patient } from "../../entity/Patient";
import { BillingInfo } from "../../entity/BillingInfo";
import { MedicalRecord } from "../../entity/MedicalRecord";
import { AuthorizationService } from "../authz/authz.service";
import { IPatientsService, PatientsServiceRequest } from "../../common/interfaces/patients.service";
import { AuthzQuery } from "../authz/vendors/authz.vendors";
import * as _ from "lodash";
import { UserContext, UserPersona } from "../../common/interfaces/authz";
import * as util from "util";

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
    includes = this.filterAttributes(includes);
    return this.getConnection()
      .getRepository(Patient)
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.billingInfo", "b")
      .leftJoinAndSelect("p.medicalRecords", "mr")
      .select(this.filterColumns(includes))
      .getMany();
  }

  @UseInterceptors(ClassSerializerInterceptor)
  async detail(user: UserContext, patientId: number, includes?: string[]): Promise<Patient> {
    includes = this.filterAttributes(includes);

    const personas = _.chain(user.persona)
      .keyBy("type")
      .mapValues((v: keyof UserPersona) => _.omit(v, "type"))
      .value();

    // authz
    if (this.getAuthzEnabled()) {
      let request: PatientsServiceRequest = <PatientsServiceRequest>{
        subject: _.extend({ user: _.omit(user, ["persona"]) }, personas),
        target: {
          patient: await this.getPatient(patientId),
          action: "view",
          attributes: includes
        }
      };

      let decisions = await Promise.all(
        _.map(this.translateRequestToAuthzQuery(request), async authzQuery => {
          return {
            query: authzQuery,
            decision: await this.authzService.getDecision(authzQuery)
          };
        })
      );

      if (
        _.chain(decisions)
          .map(i => i.decision)
          .includes(false)
          .value()
      )
        throw new ForbiddenException();
    }

    return this.getConnection()
      .getRepository(Patient)
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.billingInfo", "b")
      .leftJoinAndSelect("p.medicalRecords", "mr")
      .select(this.filterColumns(includes))
      .where("p.id = :id", { id: patientId })
      .getOne();
  }

  /**
   * filters domain attributes to be queried
   */
  private filterAttributes(includes?: string[]): string[] {
    if (!_.isArray(includes) || _.isEmpty(includes)) {
      // include all by default
      includes = _.keys(PatientsService.InclCandidates);
    } else {
      includes = _.union(includes, PatientsService.DefaultCandidates);
    }

    return includes;
  }

  /**
   * converts attributes of a domain object into table columns
   */
  private filterColumns(includes?: string[]): string[] {
    return _.chain(includes)
      .map(attr => PatientsService.InclCandidates[attr])
      .filter(i => !_.isNil(i))
      .map(cb => cb(this.getConnection()))
      .flatten()
      .value();
  }

  // exposed for testing
  private getConnection(): Connection {
    return getConnection();
  }

  // exposed for testing
  private getAuthzEnabled(): boolean {
    return this.authzEnabled;
  }

  // exposed for testing
  translateRequestToAuthzQuery(request: PatientsServiceRequest): AuthzQuery[] {
    const action = request.target.action;
    const patient = request.target.patient;
    const resources = _.map(request.target.attributes, attr => `patient:${_.get(patient, "id", "*")}:${attr}`);

    return _.map(resources, resource => ({
      data: { input: request.subject, context: { patient: patient } },
      action: action,
      target: resource
    }));
  }

  private async getPatient(id: number): Promise<Patient> {
    return this.getConnection()
      .getRepository(Patient)
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.billingInfo", "b")
      .leftJoinAndSelect("p.medicalRecords", "mr")
      .leftJoinAndSelect("mr.doctorsAssigned", "doctorsAssigned")
      .where("p.id = :id", { id: id })
      .getOne();
  }
}
