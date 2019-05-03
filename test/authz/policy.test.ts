import * as _ from "lodash";
import { Enforcer, newEnforcer, newModel } from "casbin";
import { AbacMatcher } from "src/service/authz/vendors/casbin/abacMatcher";

// stub
const doctorUser = { id: 1 };
const accountantUser = { id: 2 };
const patientUser = { id: 3 };
const adminUser = { id: 4, privilegeLevel: 10 };
const patientData = {
  id: 3,
  medicalRecord: { assignedTo: 1 },
  billingInfo: { assignedTo: 2 }
};
const context = {
  ADMIN_PRIVILEGE: 5
};

test("loadMatcher", async () => {
  await getTestEnforcer("test/authz/config/casbin_model.conf");
});

test("matcherWithRegex", async () => {
  let count;
  const cb = (/* ...args: string[] */): boolean => {
    count += 1;
    return true;
  };
  const m = newModel();
  m.addDef("r", "r", "obj");
  m.addDef("p", "p", "obj");
  m.addDef("e", "e", "some(where (p.eft == allow))");
  m.addDef("m", "m", "regexMatch(r.obj, p.obj) && cb(r.obj, p.obj)");
  const e = await newEnforcer(m);
  await e.addPolicy("alice:.*:.*");
  await e.addPolicy("alice:.*:A");
  await e.addPolicy("alice:.*:B");
  e.addFunction("cb", cb);

  count = 0;
  await e.enforce("alice:resource1:A");
  expect(count).toEqual(2);

  count = 0;
  await e.enforce("alice:*:A");
  expect(count).toEqual(2);
});

test("simpleAttribute:patientUser views own profile", async () => {
  const enforcer = await getTestEnforcer("test/authz/config/casbin_model.conf", "test/authz/config/test_policy.csv");
  await testEnforce(
    enforcer,
    {
      act: "view",
      obj: "patient:3:*",
      input: { user: patientUser, patient: patientData, context }
    },
    true
  );
});

test("simpleAttribute:doctorUser views patient's profile", async () => {
  const enforcer = await getTestEnforcer("test/authz/config/casbin_model.conf", "test/authz/config/test_policy.csv");
  await testEnforce(
    enforcer,
    {
      act: "view",
      obj: "patient:3:*",
      input: { user: doctorUser, patient: patientData, context }
    },
    false
  );
});

test("simpleAttribute:doctorUser views own patient's medicalRecord", async () => {
  const enforcer = await getTestEnforcer("test/authz/config/casbin_model.conf", "test/authz/config/test_policy.csv");
  await testEnforce(
    enforcer,
    {
      act: "view",
      obj: "patient:3:medicalRecord",
      input: { user: doctorUser, patient: patientData, context }
    },
    true
  );
});

test("simpleAttribute:accountantUser views own patient's billingInfo ", async () => {
  const enforcer = await getTestEnforcer("test/authz/config/casbin_model.conf", "test/authz/config/test_policy.csv");
  await testEnforce(
    enforcer,
    {
      act: "view",
      obj: "patient:3:billingInfo",
      input: { user: accountantUser, patient: patientData, context }
    },
    true
  );
});

test("simpleAttribute:doctorUser views own patient's billingInfo", async () => {
  const enforcer = await getTestEnforcer("test/authz/config/casbin_model.conf", "test/authz/config/test_policy.csv");
  await testEnforce(
    enforcer,
    {
      act: "view",
      obj: "patient:3:billingInfo",
      input: { user: doctorUser, patient: patientData, context }
    },
    false
  );
});

test("simpleAttribute:accountantUser views own patient's MedicalRecord", async () => {
  const enforcer = await getTestEnforcer("test/authz/config/casbin_model.conf", "test/authz/config/test_policy.csv");
  await testEnforce(
    enforcer,
    {
      act: "view",
      obj: "patient:3:medicalRecord",
      input: { user: accountantUser, patient: patientData, context }
    },
    false
  );
});

test("policyExtractor:patientUser views own profile", async () => {
  const enforcer = await getTestEnforcer("test/authz/config/casbin_model.conf", "test/authz/config/test_policy.csv");
  const matcher = new AbacMatcher();
  const params = {
    input: { user: patientUser, patient: patientData, context },
    obj: "patient:3:medicalRecord",
    act: "view",
    matcher: matcher
  };
  await enforcer.enforce(params.input, params.obj, params.act, params.matcher);

  const checkedPolicies = _.map(matcher.getCheckedPolicies(), (policy: any[]) => policy.join(", "));
  expect(checkedPolicies).toHaveLength(3);
  expect(checkedPolicies).toContain("view, patient:.*:.*, =, user.id, patient.id");
  expect(checkedPolicies).toContain("view, patient:.*:.*, >=, user.privilegeLevel, context.ADMIN_PRIVILEGE");
  expect(checkedPolicies).toContain("view, patient:.*:medicalRecord, =, user.id, patient.medicalRecord.assignedTo");

  const matchedPolicies = _.map(matcher.getMatchedPolicies(), (policy: any[]) => policy.join(", "));
  expect(matchedPolicies).toHaveLength(1);
  expect(matchedPolicies).toContain("view, patient:.*:.*, =, user.id, patient.id");
});

test("policyExtractor:doctorUser views all patient's medicalRecord", async () => {
  const enforcer = await getTestEnforcer("test/authz/config/casbin_model.conf", "test/authz/config/test_policy.csv");
  const matcher = new AbacMatcher();
  const params = {
    input: { user: doctorUser, context },
    obj: "patient:*:medicalRecord",
    act: "view",
    matcher: matcher
  };
  await enforcer.enforce(params.input, params.obj, params.act, params.matcher);

  const checkedPolicies = _.map(matcher.getCheckedPolicies(), (policy: any[]) => policy.join(", "));
  expect(checkedPolicies).toHaveLength(3);
  expect(checkedPolicies).toContain("view, patient:.*:.*, =, user.id, patient.id");
  expect(checkedPolicies).toContain("view, patient:.*:.*, >=, user.privilegeLevel, context.ADMIN_PRIVILEGE");
  expect(checkedPolicies).toContain("view, patient:.*:medicalRecord, =, user.id, patient.medicalRecord.assignedTo");

  const matchedPolicies = _.map(matcher.getMatchedPolicies(), (policy: any[]) => policy.join(", "));
  expect(matchedPolicies).toHaveLength(0);
});

test("policyExtractor:admin views all patient's profile", async () => {
  const enforcer = await getTestEnforcer("test/authz/config/casbin_model.conf", "test/authz/config/test_policy.csv");
  const matcher = new AbacMatcher();
  const params = {
    input: { user: adminUser, context },
    obj: "patient:*:medicalRecord",
    act: "view",
    matcher: matcher
  };
  await enforcer.enforce(params.input, params.obj, params.act, params.matcher);

  const checkedPolicies = _.map(matcher.getCheckedPolicies(), (policy: any[]) => policy.join(", "));
  expect(checkedPolicies).toHaveLength(3);
  expect(checkedPolicies).toContain("view, patient:.*:.*, =, user.id, patient.id");
  expect(checkedPolicies).toContain("view, patient:.*:.*, >=, user.privilegeLevel, context.ADMIN_PRIVILEGE");
  expect(checkedPolicies).toContain("view, patient:.*:medicalRecord, =, user.id, patient.medicalRecord.assignedTo");

  const matchedPolicies = _.map(matcher.getMatchedPolicies(), (policy: any[]) => policy.join(", "));
  expect(matchedPolicies).toHaveLength(1);
  expect(checkedPolicies).toContain("view, patient:.*:.*, >=, user.privilegeLevel, context.ADMIN_PRIVILEGE");
});

async function testEnforce(e: Enforcer, params: { input: any; obj: any; act: any; matcher?: any }, res: boolean) {
  expect(await e.enforce(params.input, params.obj, params.act, params.matcher)).toBe(res);
}

async function getTestEnforcer(...args: string[]): Promise<Enforcer> {
  const enforcer = await newEnforcer(...args);
  enforcer.addFunction("abacMatcherWrapper", AbacMatcher.AbacMatcherWrapper);
  return enforcer;
}
