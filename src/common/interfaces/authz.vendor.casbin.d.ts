export interface IMatcher {
  eq(lhs: any, rhs: any): boolean;
  ne(lhs: any, rhs: any): boolean;
  lt(lhs: any, rhs: any): boolean;
  lte(lhs: any, rhs: any): boolean;
  ge(lhs: any, rhs: any): boolean;
  gte(lhs: any, rhs: any): boolean;
  in(target: any, source: any): boolean;
  notIn(target: any, source: any): boolean;
  inByPath(targetPath: string, source: any, path: string): boolean;
  inByPathNested(targetPath: string, source: any, paths: string[]): boolean;
}
