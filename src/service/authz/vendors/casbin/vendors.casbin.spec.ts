import { Casbin } from "./vendors.casbin";
import { Policy } from "../../authz.adapter";

describe("authz vendor: casbin", () => {
  let casbin: Casbin;
  let policies: string[][];

  beforeAll(async () => {
    casbin = new Casbin();
    await casbin.init(Casbin.MODEL_PATH);
    //  p = act, obj, op, p1, p2
    policies = [
      ["view", "patient:.*:.*", "=", "user.id", "patient.id"],
      ["view", "some-other-resource", "=", "user.id", "patient.id"]
    ];
    await casbin.addPolicy(...policies[0]);
    await casbin.addPolicy(...policies[1]);
  });

  it("makes an authz decision", async () => {
    expect(
      await casbin.getDecision({
        target: "patient:1:*",
        action: "view",
        input: {
          user: { id: 1 },
          patient: { id: 1 }
        }
      })
    ).toEqual(true);
  });
  it("returns a list of related authz policies", async () => {
    const decisionDetails = await casbin.getDecisionDetails({
      action: "view",
      target: "patient:1:*",
      input: {
        user: { id: 2 },
        patient: { id: 1 }
      }
    });
    expect(decisionDetails.checkedPolicies).toHaveLength(1);
    expect(decisionDetails.checkedPolicies).toContainEqual(<Policy>{
      action: "view",
      resource: "patient:.*:.*",
      operation: {
        operator: "=",
        params: ["user.id", "patient.id"]
      }
    });
    expect(decisionDetails.matchedPolicies).toHaveLength(0);
  });
});
