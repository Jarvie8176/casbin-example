import { ClassSerializerInterceptor, ForbiddenException, Inject, Injectable, UseInterceptors } from "@nestjs/common";
import { Brackets, Connection, getConnection } from "typeorm";
import { Patient } from "../../entity/Patient";
import { BillingInfo } from "../../entity/BillingInfo";
import { MedicalRecord } from "../../entity/MedicalRecord";
import { AuthorizationService } from "../authz/authz.service";
import { IPatientsService, PatientsServiceRequest } from "../../common/interfaces/patients.service";
import { AuthzQuery } from "../authz/vendors/authz.vendors";
import * as _ from "lodash";
import * as util from "util";
import { UserIdentity, UserPersona } from "../../common/interfaces/authz";
import { Policy } from "../authz/authz.adapter";
import { QueryModifier } from "./queryModifier";

// export class PatientsServiceRequest

@Injectable()
export class PatientsService implements IPatientsService {
  static readonly InclCandidates = {
    patientInfo: (connection: Connection) =>
      connection.getMetadata(Patient).ownColumns.map(col => `patient.${col.propertyName}`),
    billingInfo: (connection: Connection) =>
      connection.getMetadata(BillingInfo).ownColumns.map(col => `billingInfo.${col.propertyName}`),
    medicalRecords: (connection: Connection) =>
      connection.getMetadata(MedicalRecord).ownColumns.map(col => `medicalRecords.${col.propertyName}`)
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
  async list(user: UserIdentity, includes?: string[]): Promise<Patient[]> {
    includes = this.filterAttributes(includes);

    let dataQuery = this.getConnection()
      .getRepository(Patient)
      .createQueryBuilder("patient")
      .leftJoinAndSelect("patient.billingInfo", "billingInfo")
      .leftJoinAndSelect("billingInfo.accountant", "accountant")
      .leftJoinAndSelect("patient.medicalRecords", "medicalRecords")
      .leftJoinAndSelect("medicalRecords.doctorsAssigned", "doctorsAssigned")
      .select(this.filterColumns(includes));

    // authz
    if (this.getAuthzEnabled()) {
      let authzRequest = await this.computePatientsServiceRequest(user, includes);

      let decisions = await Promise.all(
        _.map(this.translateRequestToAuthzQuery(authzRequest), async authzQuery => {
          let p = await this.authzService.getCheckedPolicies(authzQuery);
          return {
            query: authzQuery,
            policies: p
          };
        })
      );

      let attributeDecisionGroup = _.chain(decisions)
        .groupBy(decision => decision.query.attribute)
        .mapValues(policiesList => ({ query: policiesList[0].query, policies: policiesList[0].policies }))
        .value();

      // query rewrite
      _.forOwn(attributeDecisionGroup, (decisionGroup, attribute) => {
        if (_.includes(includes, attribute)) {
          dataQuery.andWhere(
            new Brackets(builder => {
              _.each(decisionGroup.policies, policy => {
                let clause = new QueryModifier(decisionGroup.query, policy).eval();
                builder.orWhere(clause.queryParticle, clause.params);
              });
            })
          );
        }
      });
    }

    return dataQuery.getMany();
  }

  @UseInterceptors(ClassSerializerInterceptor)
  async detail(user: UserIdentity, patientId: number, includes?: string[]): Promise<Patient> {
    includes = this.filterAttributes(includes);

    // authz
    if (this.getAuthzEnabled()) {
      let decisions = await Promise.all(
        _.map(
          this.translateRequestToAuthzQuery(await this.computePatientsServiceRequest(user, includes, patientId)),
          async authzQuery => {
            return {
              query: authzQuery,
              decision: await this.authzService.getDecision(authzQuery)
            };
          }
        )
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
      .createQueryBuilder("patient")
      .leftJoinAndSelect("patient.billingInfo", "billingInfo")
      .leftJoinAndSelect("billingInfo.accountant", "accountant")
      .leftJoinAndSelect("patient.medicalRecords", "medicalRecords")
      .leftJoinAndSelect("medicalRecords.doctorsAssigned", "doctorsAssigned")
      .select(this.filterColumns(includes))
      .where("patient.id = :id", { id: patientId })
      .getOne();
  }

  private async getPatient(id: number): Promise<Patient> {
    return this.getConnection()
      .getRepository(Patient)
      .createQueryBuilder("patient")
      .leftJoinAndSelect("patient.billingInfo", "billingInfo")
      .leftJoinAndSelect("billingInfo.accountant", "accountant")
      .leftJoinAndSelect("patient.medicalRecords", "medicalRecords")
      .leftJoinAndSelect("medicalRecords.doctorsAssigned", "doctorsAssigned")
      .where("patient.id = :id", { id: id })
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

  private async computePatientsServiceRequest(
    user: UserIdentity,
    attributes: string[],
    patientId?: number
  ): Promise<PatientsServiceRequest> {
    const personas = _.chain(user.persona)
      .keyBy("type")
      .mapValues((v: keyof UserPersona) => _.omit(v, "type"))
      .value();
    return {
      subject: _.extend({ user: _.omit(user, ["persona"]) }, personas),
      target: {
        patient: _.isNil(patientId) ? null : await this.getPatient(patientId),
        action: "view",
        attributes: attributes
      }
    };
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
    const resources = _.map(request.target.attributes, attr => ({
      target: `patient:${_.get(patient, "id", "*")}:${attr}`,
      attribute: attr
    }));

    return _.map(resources, resource => ({
      data: { input: request.subject, context: { patient: patient } },
      action: action,
      ...resource
    }));
  }
}
