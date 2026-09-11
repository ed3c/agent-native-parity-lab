# N-001 plan: KMP-first gaps and bottleneck order

## Current evidence

| Capability | State | Evidence or gap |
|---|---|---|
| Independent Kotlin and Swift domain logic | VERIFIED | Draft PR #2; local deterministic parity |
| Shared behavior contract and parity evidence | VERIFIED | Contract plus normalized evidence comparator |
| KMP reference implementation | OBSERVED | `kotlin-auto-webview#156@bcb7947`; unmerged compile/package subject |
| KMP reference replay in this lab | READY | Issue #4; exact read-only checkout and unit-test replay |
| Plan hash approval | READY, QUEUED | Issue #3; must close before native migration implementation |
| Independent Compose and SwiftUI screens | BLOCKED | No migration checkpoint has been extracted from KMP evidence |
| Headless execution | OBSERVED, narrow | Static lab scenario emitters only; no interactive runtime CLI |
| Runtime command bridge | BLOCKED | No migrated running app subject |
| Screenshot and event relationship comparison | BLOCKED | No named cross-implementation runtime artifacts |
| Checkpoint review receipts | BLOCKED | No visual evidence or migrated implementation |
| Performance and product continuity | BLOCKED | No comparable independent native applications |

## Architectural gaps

1. **Reference identity:** an upstream KMP leaf exists, but the lab does not yet bind or replay its
   exact unmerged commit/tree.
2. **Plan drift:** reviewed migration intent is not bound to exact content.
3. **Migration behavior:** no one-screen behavior contract has been extracted from KMP and
   implemented independently in Kotlin/Compose and Swift/SwiftUI.
4. **Runtime observability:** static evidence emitters cannot inspect or command a running app.
5. **Relationship-aware parity:** the comparator only performs deep equality after removing the
   platform field.
6. **Review provenance:** no receipt binds tests, visual evidence, two reviews, and human approval to
   one checkpoint and commit.
7. **Outcome measurement:** no reference/native startup, stability, size, build, or rendering
   measurements exist.

## Earned repository shape

Directories are added only by the atom that proves their need:

```text
docs/n-class/                         unverified question, plan, atoms
contracts/kmp-reference.v1.json       admitted by #4; identity and non-claims only
harness/kmp-reference*                admitted by #4; local validator and planted controls
approvals/                            admitted only by #3
android-app/                          unfiled until KMP replay and plan binding pass
ios-app/                              unfiled until KMP replay and plan binding pass
runtime/ and visual tooling           remain absent until a migrated screen exposes the need
```

Do not vendor the KMP source. Do not add a generic `helix/`, `tardis/`, agent framework, daemon,
database, dashboard, or second browser executor.

## Execution order

```text
#1 / Draft PR #2: domain parity kernel
  → #4: pin and replay exact KMP reference
  → #3: bind migration-plan approval to exact content
  → N-001-A3: migrate one KMP checkpoint independently to Compose and SwiftUI
  → N-001-A4: observe the first real migration failure
  → only then admit the smallest runtime, parity, or review tool that closes it
```

Issue #4 runs before #3 because the source subject must be physical before a migration plan can bind
to it. Issue #3 remains mandatory before native implementation begins.

Do not add React Native only to copy Shopify's starting point. A later RN control requires a real
product need and a separate issue.

## Stop conditions

Stop and return to N-class if:

- the exact KMP commit/tree or required paths do not match;
- upstream evidence is promoted beyond `PLAY_SAFE_WEBVIEW_COMPILE_PACKAGE_ONLY`;
- a required subject or verifier does not exist;
- the atom needs production data, credentials, upstream writes, or external navigation;
- acceptance depends only on an Agent or human saying the output looks correct;
- GREEN has no planted RED that discriminates the protected behavior;
- the proposed abstraction is not required by the first migrated screen;
- the result would exceed the issue's evidence ceiling.
