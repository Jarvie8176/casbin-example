import { AbacMatcher } from "./abacMatcher";
import { InvalidInput } from "../../../../common/errors/errors";

describe("abacMatcher", () => {
  const abacMatcher = new AbacMatcher();
  describe("matcher", () => {
    it("binary op", () => {
      // p = action, resource, op, ...params
      expect(abacMatcher.match(["", "", "=", "input.a", "context.b"], { input: { a: 1 }, context: { b: 1 } })).toEqual(
        true
      );
      expect(abacMatcher.match(["", "", "=", "input.a", "context.b"], { input: { a: 1 }, context: { b: 2 } })).toEqual(
        false
      );
      expect(abacMatcher.match(["", "", "!=", "input.a", "context.b"], { input: { a: 1 }, context: { b: 2 } })).toEqual(
        true
      );
      expect(abacMatcher.match(["", "", "!=", "input.a", "context.b"], { input: { a: 1 }, context: { b: 1 } })).toEqual(
        false
      );
      expect(abacMatcher.match(["", "", "<", "input.a", "context.b"], { input: { a: 1 }, context: { b: 2 } })).toEqual(
        true
      );
      expect(abacMatcher.match(["", "", "<", "input.a", "context.b"], { input: { a: 2 }, context: { b: 2 } })).toEqual(
        false
      );
      expect(abacMatcher.match(["", "", "<", "input.a", "context.b"], { input: { a: 3 }, context: { b: 2 } })).toEqual(
        false
      );
      expect(abacMatcher.match(["", "", "<=", "input.a", "context.b"], { input: { a: 1 }, context: { b: 2 } })).toEqual(
        true
      );
      expect(abacMatcher.match(["", "", "<=", "input.a", "context.b"], { input: { a: 2 }, context: { b: 2 } })).toEqual(
        true
      );
      expect(abacMatcher.match(["", "", "<=", "input.a", "context.b"], { input: { a: 3 }, context: { b: 2 } })).toEqual(
        false
      );
      expect(abacMatcher.match(["", "", ">=", "input.a", "context.b"], { input: { a: 1 }, context: { b: 2 } })).toEqual(
        false
      );
      expect(abacMatcher.match(["", "", ">=", "input.a", "context.b"], { input: { a: 2 }, context: { b: 2 } })).toEqual(
        true
      );
      expect(abacMatcher.match(["", "", ">=", "input.a", "context.b"], { input: { a: 3 }, context: { b: 2 } })).toEqual(
        true
      );
      expect(abacMatcher.match(["", "", ">", "input.a", "context.b"], { input: { a: 1 }, context: { b: 2 } })).toEqual(
        false
      );
      expect(abacMatcher.match(["", "", ">", "input.a", "context.b"], { input: { a: 2 }, context: { b: 2 } })).toEqual(
        false
      );
      expect(abacMatcher.match(["", "", ">", "input.a", "context.b"], { input: { a: 3 }, context: { b: 2 } })).toEqual(
        true
      );
    });
    it("in, notIn", () => {
      expect(
        abacMatcher.match(["", "", "in", "input.a", "context.list"], { input: { a: 1 }, context: { list: [1, 2, 3] } })
      ).toEqual(true);
      expect(
        abacMatcher.match(["", "", "in", "input.a", "context.list"], { input: { a: 4 }, context: { list: [1, 2, 3] } })
      ).toEqual(false);
      expect(
        abacMatcher.match(["", "", "in", "input.a", "context.list"], { input: "?", context: { list: [1, 2, 3] } })
      ).toEqual(false);
      expect(abacMatcher.match(["", "", "in", "input.a", "context.list"], { context: { list: [1, 2, 3] } })).toEqual(
        false
      );
      expect(
        abacMatcher.match(["", "", "notIn", "input.a", "context.list"], {
          input: { a: 4 },
          context: { list: [1, 2, 3] }
        })
      ).toEqual(true);
      expect(
        abacMatcher.match(["", "", "notIn", "input.a", "context.list"], {
          input: { a: 3 },
          context: { list: [1, 2, 3] }
        })
      ).toEqual(false);
    });
    it("inByPath, inByPathNested", () => {
      expect(
        abacMatcher.match(["", "", "inByPath", "input.a", "input.b", "c"], {
          input: { a: 2, b: [{ c: 1 }, { c: 2 }, { c: 3 }] }
        })
      ).toEqual(true);
      expect(
        abacMatcher.match(["", "", "inByPath", "input.a", "input.b", "c"], {
          input: { a: 4, b: [{ c: 1 }, { c: 2 }, { c: 3 }] }
        })
      ).toEqual(false);
      expect(
        abacMatcher.match(["", "", "inByPath", "input.a", "input.b", "c"], {
          input: { b: [{ c: 1 }, { c: 2 }, { c: 3 }] }
        })
      ).toEqual(false);
      expect(
        abacMatcher.match(
          ["", "", "inByPathNested", "input.user.id", "context.patient.medicalRecords", "doctorsAssigned", "id"],
          {
            input: {
              user: { id: 1 }
            },
            context: {
              patient: {
                medicalRecords: [
                  {
                    doctorsAssigned: [{ id: 1 }, { id: 2 }]
                  },
                  {
                    doctorsAssigned: [{ id: 3 }, { id: 4 }]
                  }
                ]
              }
            }
          }
        )
      ).toEqual(true);
      expect(
        abacMatcher.match(
          ["", "", "inByPathNested", "input.a", "context.patient.medicalRecords", "doctorsAssigned", "id"],
          {
            input: {
              user: { id: 5 }
            },
            context: {
              patient: {
                medicalRecords: [
                  {
                    doctorsAssigned: [{ id: 1 }, { id: 2 }]
                  },
                  {
                    doctorsAssigned: [{ id: 3 }, { id: 4 }]
                  }
                ]
              }
            }
          }
        )
      ).toEqual(false);
    });
  });
  describe("exceptions", () => {
    it("unsupported op", () => {
      expect(abacMatcher.match(["", "", "foo"], {})).toEqual(false);
    });
    it("missing params", () => {
      expect(abacMatcher.match(["", "", "<=", "input.a", "context.b"], {})).toEqual(false);
      expect(abacMatcher.match(["", "", "<=", "input.a", "context.b"], { input: {}, context: {} })).toEqual(false);
      expect(
        abacMatcher.match(["", "", "<=", "input.a", "context.b"], { input: {}, context: { b: undefined } })
      ).toEqual(false);
    });
  });
});
