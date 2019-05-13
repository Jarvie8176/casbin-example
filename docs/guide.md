# Goal

## Authorization Service

- Given the context, The Authorization service should:
  - produce a boolean decision of whether a user can access a particular resource.
  - produce a list of access policies of how decisions can be made.

## Domain Service

- Given the authorization decision, the domain service should:

  - enforce the decision.
  - list available resources.

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

- A patient can view all of own attributes.
- A doctor can view `info` AND `medicalRecords` of patients who's `medicalRecord` is assigned to that doctor.
- An accountant can view `info` AND `billing info` of patients who's `billing info` is assigned to that doctor.
- An admin can do anything.

# Implementation

## Authorization Service

### Terminology

- input
  - normalized input from the requesting user, e.g. user id.
- context
  - context of the authz request, e.g. current state of the requested resource, system time.
- AUTHZ_CTX
  - static environment variables.

### Core

### Match Function

for each policy, `match()` produces a boolean result of whether the condition is met based on `input`, `context`, and `AUTHZ_CTX`

#### Signature

`match(op, p1, p2, ..., pn): boolean`

- op:
  - operator of the policy. `"="`, `"!="`, `"<"`, `"<="`, `"in"`, etc.
- p1, p2, ..., pn:
 * path to 

### Authorization Decision

### Policy Filter

## Domain Service

### Query Rewrite
