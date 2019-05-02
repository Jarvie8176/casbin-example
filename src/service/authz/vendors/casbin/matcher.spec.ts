import { InvalidInput } from "src/common/errors";
import { myMatcher, myMatcherWrapper } from "./matcher";

describe("custom matcher", () => {
  it("example usages", () => {
    expect(myMatcher("=", ["1", "1"])).toEqual(true);
    expect(myMatcher("=", ["1", "2"])).toEqual(false);
    expect(myMatcher("!=", ["1", "2"])).toEqual(true);
    expect(myMatcher("<", ["1", "2"])).toEqual(true);
    expect(myMatcher(">", ["2", "1"])).toEqual(true);
    expect(myMatcher("<=", ["1", "1"])).toEqual(true);
    expect(myMatcher("<=", ["1", "2"])).toEqual(true);
    expect(myMatcher(">=", ["1", "1"])).toEqual(true);
    expect(myMatcher(">=", ["1", "2"])).toEqual(false);
    expect(myMatcher("in", [["1", "2"], "1"])).toEqual(true);
    expect(myMatcher("in", [["1", "2"], "3"])).toEqual(false);
    expect(myMatcher("notIn", [["2", "3"], "1"])).toEqual(true);
    expect(myMatcher("notIn", [["2", "3"], "3"])).toEqual(false);
  });

  it("unsupported operator", () => {
    let err;
    try {
      myMatcher("foo", ["1", "2"]);
    } catch (e) {
      err = e;
    }
    expect(err instanceof InvalidInput).toBe(true);
    expect(err.message).toBe("unsupported operator: foo");
  });

  it("invalid input", () => {
    expect(() => myMatcher("=", [])).toThrow();
    expect(() => myMatcher("=", [null, undefined])).toThrow();
    expect(() => myMatcher(">=", [])).toThrow();
    expect(() => myMatcher(">=", [null, undefined])).toThrow();
    expect(() => myMatcher("in", [])).toThrow();
    expect(() => myMatcher("in", [null, undefined])).toThrow();
  });

  it("abacMatcherWrapper", () => {
    expect(myMatcherWrapper({ a: 1, b: 1 }, "=", "a", "b")).toEqual(true);
    expect(myMatcherWrapper({ a: 1, b: 2 }, "=", "a", "b")).toEqual(false);
  });
});
