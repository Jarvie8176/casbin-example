import { myMatcherWrapper } from "src/casbin/matcher";
import { Enforcer, newEnforcer, newModel } from "casbin";

// stub
const doctorUser = { id: 1 };
const accountantUser = { id: 2 };
const patientUser = { id: 3 };
const patientData = {
  id: 3,
  medicalRecord: { assignedTo: 1 },
  billingInfo: { assignedTo: 2 }
};

test("loadMatcher", async () => {
  await getTestEnforcer("test/casbin/casbin_model.conf");
});

test("matcherWithRegex", async () => {
  let count;
  const cb = (...args: string[]): boolean => {
    console.debug(args);
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
});

test("simpleAttribute:patientUser views own profile", async () => {
  const enforcer = await getTestEnforcer("test/casbin/casbin_model.conf", "test/casbin/test_policy.csv");
  await testEnforce(
    enforcer,
    {
      act: "view",
      obj: "patient:3:*",
      input: { user: patientUser, patient: patientData }
    },
    true
  );
});

test("simpleAttribute:doctorUser views patient's profile", async () => {
  const enforcer = await getTestEnforcer("test/casbin/casbin_model.conf", "test/casbin/test_policy.csv");
  await testEnforce(
    enforcer,
    {
      act: "view",
      obj: "patient:3:*",
      input: { user: doctorUser, patient: patientData }
    },
    false
  );
});

test("simpleAttribute:doctorUser views own patient's medicalRecord", async () => {
  const enforcer = await getTestEnforcer("test/casbin/casbin_model.conf", "test/casbin/test_policy.csv");
  await testEnforce(
    enforcer,
    {
      act: "view",
      obj: "patient:3:medicalRecord",
      input: { user: doctorUser, patient: patientData }
    },
    true
  );
});

test("simpleAttribute:accountantUser views own patient's billingInfo ", async () => {
  const enforcer = await getTestEnforcer("test/casbin/casbin_model.conf", "test/casbin/test_policy.csv");
  await testEnforce(
    enforcer,
    {
      act: "view",
      obj: "patient:3:billingInfo",
      input: { user: accountantUser, patient: patientData }
    },
    true
  );
});

test("simpleAttribute:doctorUser views own patient's billingInfo", async () => {
  const enforcer = await getTestEnforcer("test/casbin/casbin_model.conf", "test/casbin/test_policy.csv");
  await testEnforce(
    enforcer,
    {
      act: "view",
      obj: "patient:3:billingInfo",
      input: { user: doctorUser, patient: patientData }
    },
    false
  );
});

test("simpleAttribute:accountantUser views own patient's MedicalRecord", async () => {
  const enforcer = await getTestEnforcer("test/casbin/casbin_model.conf", "test/casbin/test_policy.csv");
  await testEnforce(
    enforcer,
    {
      act: "view",
      obj: "patient:3:medicalRecord",
      input: { user: accountantUser, patient: patientData }
    },
    false
  );
});

async function testEnforce(e: Enforcer, { input, obj, act }, res: boolean) {
  expect(await e.enforce(input, obj, act)).toBe(res);
}

async function getTestEnforcer(...args: string[]): Promise<Enforcer> {
  const enforcer = await newEnforcer(...args);
  enforcer.addFunction("abacMatcher", myMatcherWrapper);
  return enforcer;
}
