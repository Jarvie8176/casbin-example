import { myMatcher, myMatcherWrapper } from "src/casbin/matcher";

test("comparisons", () => {
  expect(myMatcher("=", ["1", "1"])).toEqual(true);
  expect(myMatcher("=", ["1", "2"])).toEqual(false);
  expect(myMatcher("<", ["1", "2"])).toEqual(true);
  expect(myMatcher(">", ["2", "1"])).toEqual(true);
  expect(myMatcher("<=", ["1", "1"])).toEqual(true);
  expect(myMatcher("<=", ["1", "2"])).toEqual(true);
  expect(myMatcher(">=", ["1", "1"])).toEqual(true);
  expect(myMatcher(">=", ["1", "2"])).toEqual(false);
});

test("unsupported operator", () => {
  expect(() => {
    myMatcher("foo", ["1", "2"]);
  }).toThrow("unsupported operator: foo");
});

test("abacMatcherWrapper", () => {
  expect(myMatcherWrapper({ a: 1, b: 1 }, "=", "a", "b")).toEqual(true);
  expect(myMatcherWrapper({ a: 1, b: 2 }, "=", "a", "b")).toEqual(false);
});
