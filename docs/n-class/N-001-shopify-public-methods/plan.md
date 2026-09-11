# N-001 plan: gaps and bottleneck order

## Current evidence

| Capability | State | Evidence or gap |
|---|---|---|
| Independent Kotlin and Swift domain logic | VERIFIED | Draft PR #2; exact-head CI run 34567549817 |
| Shared behavior contract and parity evidence | VERIFIED | Contract plus normalized evidence comparator |
| Headless execution | OBSERVED, narrow | Static scenario emitters only; no interactive CLI |
| Human authority | OBSERVED, narrow | Exact operation approval and human-owned merge |
| React Native, Compose, and SwiftUI screen | BLOCKED | No runnable UI subject exists |
| Plan hash approval | BLOCKED | No plan or approval receipt validator |
| Pi-style migration artifact flow | BLOCKED | No real reference screen to inspect and migrate |
| Tardis-style runtime bridge | BLOCKED | No running app event/log/state source |
| Screenshot and event relationship comparison | BLOCKED | No named runtime checkpoint artifacts |
| Helix-style checkpoint review gate | BLOCKED | No visual evidence or reviewer receipts |
| Performance and product continuity | BLOCKED | No comparable applications or production subject |

## Architectural gaps

1. **Plan drift:** reviewed intent is not bound to exact content.
2. **Physical UI subject:** domain parity cannot expose UI, accessibility, lifecycle, analytics, or
   rendering failures.
3. **Runtime observability:** static evidence emitters cannot inspect or command a running app.
4. **Relationship-aware parity:** the comparator only performs deep equality after removing the
   platform field.
5. **Review provenance:** no receipt binds tests, visual evidence, two reviews, and human approval to
   one checkpoint and commit.
6. **Outcome measurement:** no RN/native startup, stability, size, build, or rendering measurements.

## Earned repository shape

Directories are added only by the atom that proves their need:

```text
docs/n-class/                         unverified question, plan, atoms
contracts/                            shared behavior and evidence only
approvals/                            admitted only by #3
reference-rn/                         admitted only by #4
android-app/                          admitted only by #4
ios-app/                              admitted only by #4
runtime/ and visual tooling           remain absent until a runnable subject exposes the need
```

Do not add a generic `helix/`, `tardis/`, agent framework, daemon, database, dashboard, or shared
mobile domain module.

## Execution order

```text
#1 / Draft PR #2: domain parity kernel
  → #3: plan hash approval gate
  → #4: one RN / Compose / SwiftUI checkpoint
  → N-001-A3: observe the first real migration failure
  → only then admit the smallest runtime, parity, or review tool that closes it
```

The primary product bottleneck is #4: there is no runnable migration subject. Issue #3 runs first
because it is a small, local safety gate that prevents approval drift before UI migration work
starts.

Do not parallelize #3 and #4. Do not file Tardis-, Helix-, or performance-shaped issues merely to
match Shopify's vocabulary.

## Stop conditions

Stop and return to N-class if:

- a required subject or verifier does not exist;
- the atom needs production data, credentials, or external writes;
- acceptance depends only on an Agent or human saying the output looks correct;
- GREEN has no planted RED that discriminates the protected behavior;
- the proposed abstraction is not required by the first real screen;
- the result would exceed the issue's evidence ceiling.
