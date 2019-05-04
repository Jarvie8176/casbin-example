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
      ["view", "patient:.*:.*", "=", "input.user.id", "context.patient.id"],
      ["view", "some-other-resource", "=", "input.user.id", "context.patient.id"]
    ];
    await casbin.addPolicy(...policies[0]);
    await casbin.addPolicy(...policies[1]);
  });

  it("makes an authz decision", async () => {
    expect(
      await casbin.getDecision({
        target: "patient:1:*",
        action: "view",
        data: {
          input: {
            user: { id: 1 }
          },
          context: {
            patient: { id: 1 }
          }
        },
        attribute: ""
      })
    ).toEqual(true);
  });
  it("returns a list of related authz policies", async () => {
    const decisionDetails = await casbin.getDecisionDetails({
      action: "view",
      target: "patient:1:*",
      data: {
        input: { user: { id: 2 } },
        context: { patient: { id: 1 } }
      },
      attribute: ""
    });
    expect(decisionDetails.checkedPolicies).toHaveLength(1);
    expect(decisionDetails.checkedPolicies).toContainEqual(<Policy>{
      action: "view",
      resource: "patient:.*:.*",
      operation: {
        operator: "=",
        params: ["input.user.id", "context.patient.id"]
      }
    });
    expect(decisionDetails.matchedPolicies).toHaveLength(0);
  });
});
