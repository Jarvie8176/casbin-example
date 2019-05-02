import { PolicyFromRawPolicy } from "./utils";
import { Policy } from "../../authz.adapter";

test("example", () => {
  const input = ["view", "patient:.*:.*", "=", "user.id", "patient.id"];
  expect(PolicyFromRawPolicy(input)).toEqual(<Policy>{
    action: "view",
    resource: "patient:.*:.*",
    operation: {
      operator: "=",
      params: ["user.id", "patient.id"]
    }
  });
});
