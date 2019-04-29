import { myMatcherWrapper } from "src/casbin/matcher";
import { Enforcer, newEnforcer } from "casbin";

async function testEnforce(e: Enforcer, { input, obj, act }, res: boolean) {
  expect(await e.enforce(input, obj, act)).toBe(res);
}

test("loadMatcher", async () => {
  const enforcer = await newEnforcer("config/casbin_model.conf");
  enforcer.addFunction("abacMatcher", myMatcherWrapper);
});

test("simplePolicyWithAbacMatcher", async () => {
  const enforcer = await newEnforcer("config/casbin_model.conf");
  enforcer.addFunction("abacMatcher", myMatcherWrapper);
  const p = ["view", "patient:medicalRecord", "=", "doctor.id", "patient.medicalRecord.assignedTo"];
  await enforcer.addPolicy(...p);
  await testEnforce(
    enforcer,
    {
      input: { doctor: { id: 1 }, patient: { medicalRecord: { assignedTo: 1 } } },
      obj: "patient:medicalRecord",
      act: "view"
    },
    true
  );
});

test("simpleAttributeCheckWithAbacMatcher", async () => {
  const enforcer = await newEnforcer("config/casbin_model.conf", "test/casbin/test_policy.csv");
  enforcer.addFunction("abacMatcher", myMatcherWrapper);
  const doctor = { id: 1 };
  const accountant = { id: 2 };
  const patient = { medicalRecord: { assignedTo: 1 }, billingInfo: { assignedTo: 2 } };

  // doctor views own patient's medicalRecord
  await testEnforce(
    enforcer,
    {
      act: "view",
      obj: "patient:medicalRecord",
      input: { doctor, patient }
    },
    true
  );

  // accountant views own patient's billingInfo
  await testEnforce(
    enforcer,
    {
      act: "view",
      obj: "patient:billingInfo",
      input: { accountant, patient }
    },
    true
  );

  // doctor views own patient's billingInfo
  await testEnforce(
    enforcer,
    {
      act: "view",
      obj: "patient:billingInfo",
      input: { doctor, patient }
    },
    false
  );

  // accountant views own patient's MedicalRecord
  await testEnforce(
    enforcer,
    {
      act: "view",
      obj: "patient:medicalRecord",
      input: { accountant, patient }
    },
    false
  );
});
