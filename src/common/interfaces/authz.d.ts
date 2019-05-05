import { QueryBuilder } from "typeorm";

export interface UserIdentity {
  id: number;
  privilegeLevel?: number;
  persona: UserPersona[];
}

export interface UserPersona {
  type: "doctor" | "patient" | "accountant" | "admin";
  id: number;
}

export interface IMatcher {
  eval(...args: any[]): any;
}

export interface IPolicyMatcher extends IMatcher {
  eval(...args: any): boolean;
  eq(...args: any): boolean;
  ne(...args: any): boolean;
  lt(...args: any): boolean;
  lte(...args: any): boolean;
  ge(...args: any): boolean;
  gte(...args: any): boolean;
  in(...args: any): boolean;
  notIn(...args: any): boolean;
  inByPath(...args: any): boolean;
  inByPathNested(...args: any): boolean;
}

export interface IQueryModifier {
  eval(): ModificationClause;
  primitives(): ModificationClause;
  in(): ModificationClause;
  notIn(): ModificationClause;
  inByPath(): ModificationClause;
  inByPathNested(): ModificationClause
}

export interface ModificationClause {
  queryParticle: string;
  params: {};
}
