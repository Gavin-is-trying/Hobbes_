# Requirement Challenge Framework

## Requirement Register

Record one row per requirement.

| ID | Original requirement | Accountable person or role | Source | Intended outcome or protected risk | Evidence | Failure consequence | Smallest valid requirement | Decision |
|---|---|---|---|---|---|---|---|---|
| R-001 |  |  |  |  |  |  |  |  |

## Source Classification

Classify each source as one of:

- Law or regulation
- Contract or explicit customer commitment
- Safety or security control
- Financial control
- Employment or privacy obligation
- Technical constraint
- Internal policy
- Historical practice
- Preference or assumption
- Unknown

A source classification does not prove validity. Obtain the exact source, current interpretation, scope, and accountable owner.

## Strong Challenge Questions

Ask of every requirement:

1. Who specifically owns this requirement and can explain it?
2. What outcome does it create or what evidenced risk does it control?
3. What is the authoritative source?
4. Is the source current and interpreted correctly?
5. Does it apply to every case, or only an exception class?
6. What evidence shows the requirement works?
7. What happens if it is removed for a limited, reversible test?
8. Can its frequency, scope, precision, retention period, or approval level be reduced?
9. Is it compensating for a defect that should be prevented upstream?
10. Would the customer knowingly pay for this requirement?
11. Is a tool limitation being mistaken for a business requirement?
12. Can the intended outcome be expressed as a smaller, testable constraint?

## Decision Rules

- **DELETE:** No defensible outcome, owner, source, or evidence; impact is acceptably reversible.
- **EXPERIMENTALLY REMOVE:** Evidence is uncertain and a bounded test can validate removal safely.
- **COMBINE:** Multiple requirements protect the same outcome and can become one constraint.
- **RETAIN:** The smallest version is justified by evidence or a verified obligation.
- **VERIFY BEFORE REMOVAL:** The requirement may protect a legal, contractual, safety, financial, employment, privacy, security, or explicit customer commitment and expert verification is incomplete.

## Anti-Patterns

Reject these as standalone justifications:

- “We have always done it.”
- “It is best practice.”
- “Management requires it.”
- “The software requires it.”
- “An auditor might ask.”
- “It could be useful someday.”
- “That is how the template works.”

Convert each into a named owner, authoritative source, intended outcome, evidence, and minimal constraint—or recommend deletion.
