# Goal

## Authorization Service

- Given the context, The Authorization service should:
  - produce a boolean decision of whether a user can access a particular resource.
  - produce a list of policies of how decisions can be made.

## Domain Service

- Given the authorization decision, the domain service should:
  - enforce the decision.
  - fetch (properties) of available resources.

# Functional Requirements

## Domain Model

### Patient

- must have one id.
- can have one billing information.
- can have many medical records.

### Accountant:

- must have one id.
- can have many billing informations of one patient.

### Doctor:

- must have one id.
- can have many medical records of many patients.

## Authorization Policy

- A patient can view all of own properties.
- A doctor can view `info` AND `medicalRecords` of patients who's `medicalRecord` is assigned to that doctor.
- An accountant can view `info` AND `billing info` of patients who's `billing info` is assigned to that doctor.
- An admin can do everything.

# Implementation

## Project structure

- api/controller: web API
- entity/: Dao
- service/:
  - patients: domain logic
  - authz:
    - authz.service: authz API for other services
    - vendors:
      - casbin: proxy of node-casbin
        - abacMatcher: core PDP logic (policy matching and decisions)

## Authorization Service

### Terminology

- input
  - normalized input from the requesting user, e.g. user id.
- context
  - context of the authz request, e.g. current state of the requested resource, system time.
- AUTHZ_CTX
  - static environment variables. e.g. `ADMIN_PRIVILEGE_LEVEL = 5`.

### Core

### Match Function

For each policy, `match()` produces a boolean result of whether the condition is met based on `input`, `context`, and `AUTHZ_CTX`.

#### Signature

`match(op, p1, p2, ..., pn): boolean`

- `op`:
  - Basic Logical operators:
    - `=`
    - `!=`
    - `<`
    - `<=`
    - `>"`
    - `>=
  - Nested operators:
    - `in`
    - `notIn`
    - `inByPath`
      - e.g. refers to `id` in `{ "accountant": [{"id": 1}] }`
    - `inByPathNested`
      - e.g. refers to `id` in `{ "medicalRecords": [{ "doctor": { "id": 1 } }] }`
- `p1`, `p2`, ..., `pn`:
  - path to an argument

details of usages in `src/service/authz/vendors/casbin/abacMatcher.spec.ts`.

### Authorization Decision

- casbin's built-in functions can handle static, coarse-grained access control,
  - i.e. `r.act == p.act && regexMatch(r.obj, p.obj)`
- fine-grained access control requires evaluation based on rich input and context (e.g. a nested json), and (relatively) complex logic (e.g. `in`, `inByPath`), so it's better to write such evaluation in a programming language.

#### Use Cases

##### Full Match (can current user access (part of) a particular resource)

- the requesting service only needs a boolean decision from `AuthzAdapter.getDecision()`.

##### Partial Match (what can current user see)

- the requesting service needs to modify data query, or filter out what are accessible. Such condition can be derived from `AuthzAdapter.getCheckedPolicies()`.

## Domain Service

In this example, there is one domain service `PatientsService` that serves patient data to the web API. Other than fetching data, the domain service should:

- choose columns to select based on the request (the `fields` parameter)
- rewrite sql query based on authorization policies.

### Connecting Authorization service and DB Schema

In order to decouple authz service and the underlying DB schema,

- Authz service should only interact with the the domain data, i.e. `<PatientDomainData>{ patientInfo, medicalRecords, billingInfo }`.
  ```typescript
  ```
- Query modifier should only interact with the DB schema (i.e. relations in the db schema).

Such mapping is kept in `PatientsService.InclCandidates`.

### Query Rewrite

A `QueryModifier` instance computes an element of where clause that corresponds to a policy. It is then used to rewrite a sql statement:

```typescript
// query rewrite
_.forOwn(attributeDecisionGroup, (decisionGroup, attribute) => {
  if (_.includes(includes, attribute)) {
    dataQuery.andWhere(
      new Brackets(builder => {
        _.each(decisionGroup.policies, policy => {
          let clause = new QueryModifier(decisionGroup.query, policy).eval();
          builder.orWhere(clause.queryParticle, clause.params);
        });
      })
    );
  }
});
```

Where policies are translated into a formula in CNF.

E.g. For policies A, B about column a and policies C, D about column b
where the corresponding, the corresponding sql where clause is:

```sql
where ((conditionA() or conditionB()) and (conditionC() or conditionD()))
```

# Limitations

The current implementation of authz service:

- does not support policies with more than one condition (e.g. a doctor can view patient data if the doctor _is in department A_ **AND** _has consent from the patient_).
  - One solution may be assigning policies into the same group, then `abacMatcher` should track all checked policies and compute a decision after checking all policies.

* does not support policies that denies access.
