# N-001 plan: KMP-first gaps and bottleneck order

## Current evidence

| Capability | State | Evidence or gap |
|---|---|---|
| Independent Kotlin and Swift domain logic | VERIFIED | Draft PR #2; local deterministic parity |
| Shared behavior contract and parity evidence | VERIFIED | Contract plus normalized evidence comparator |
| Exact KMP reference replay | VERIFIED, UNMERGED | Issue #4 / Draft PR #5; exact read-only unit replay |
| Plan hash approval | READY, NEXT | Issue #3 still needs the current stacked subject and exact byte contract |
| One Compose and SwiftUI checkpoint | BLOCKED_BY_A2 | No approved checkpoint plan exists |
| First real migration failure | NOT_OBSERVED | Must emerge while implementing A3; do not predict it into an issue |
| Headless execution | OBSERVED, NARROW | Existing scenario emitters may already be sufficient |
| Native runtime evidence | BLOCKED_BY_A3 | No named Compose/SwiftUI checkpoint emits runtime artifacts |
| KMP runtime baseline | NOT_AVAILABLE | Upstream #156 has compile/package/unit evidence, not runtime evidence |
| Checkpoint review receipt | BLOCKED_BY_A6 | No visual/runtime artifact set exists to approve |

## Incomplete KMP boundary

The entire KMP application does not need to be complete before native work begins. A3 may use one
frozen behavior slice after A2 binds its plan to the exact KMP commit and tree. The selected slice is
exact approved-anchor navigation:

```text
proposal
→ exact human approval
→ one dispatch
→ platform callback
→ exact observed postcondition
→ APPLIED | UNKNOWN
```

The frozen source is evidence for a behavior contract, not a runtime oracle. Until a runnable KMP
checkpoint exists, the strongest honest result is `NATIVE_CHECKPOINT_APPROVED`; it is not
`KMP_RUNTIME_PARITY`.

| Atom | Work admitted before KMP runtime exists | Maximum claim | Deferred evidence |
|---|---|---|---|
| A3 | Independent Compose and SwiftUI checkpoint against frozen contract and fixtures | `NATIVE_CONTRACT_PARITY` | KMP runtime comparison |
| A4 | Record and reduce the first real migration failure exposed by A3 | `OBSERVED_MIGRATION_FAILURE` | General migration framework |
| A5 | Add only `inspect`, `run-fixture`, and JSONL if measured feedback is inadequate | `HEADLESS_FIXTURE_REPLAY` | Daemon, socket, simulator control, dashboard |
| A6 | Compare one Android/iOS local runtime event window and deterministic local fixture screenshot | `NATIVE_RUNTIME_PARITY` | KMP runtime screenshot/event parity |
| A7 | Bind the available native-contract evidence, reviews, approval, checkpoint, and commits | `NATIVE_CHECKPOINT_APPROVED` | `KMP_RUNTIME_PARITY`, release, production |

When KMP runtime evidence becomes available, it creates a new receipt generation. It must rerun A6,
both reviews, and human approval. An earlier static-contract receipt cannot be promoted in place.

## Architectural gaps and admission triggers

| Gap | Current repository fact | Smallest addition | Admission trigger |
|---|---|---|---|
| Plan drift | No approval is bound to reviewed bytes | `approvals/` plus one validator | Run Issue #3 now |
| Checkpoint specification | Existing contract proves domain behavior, not a KMP-derived UI checkpoint | One checkpoint JSON and bundled fixtures | Issue #3 GREEN |
| Platform UI boundary | No Compose/SwiftUI app modules or effect ports | One screen and one recording port per platform | A3 filed against approved plan |
| Real failure evidence | No migration failure has been observed | One reduced reproducer and stable fingerprint | Failure occurs during A3 |
| Feedback latency | Static emitters exist; no measured bottleneck | At most three CLI commands with JSONL | A3 measurement shows tests are too slow or opaque |
| Relationship parity | Comparator only normalizes and compares whole evidence | One named event relationship verifier | A3 produces real event windows |
| Visual parity | No deterministic local runtime screenshots | One local fixture screenshot per platform | A3 can run reproducibly in CI |
| Review provenance | No artifact-bound reviewer/human receipt | One receipt schema and invalidation validator | A6 artifacts exist |
| KMP runtime baseline | Pinned upstream subject has no runtime evidence | Re-run the same named checkpoint when upstream earns it | A runnable exact KMP subject exists |

These gaps do not justify a generic `helix/`, `tardis/`, orchestration framework, daemon, database,
dashboard, shared mobile state module, second browser executor, or React Native application.

## Earned repository shape

Only the first three rows exist or are admitted now. Later paths are created by the atom that proves
their need.

```text
docs/n-class/                              question, plan, atoms
contracts/kmp-reference.v1.json            exact external identity and non-claims
harness/kmp-reference*                     exact identity validator and planted controls

approvals/                                 A2 only: one plan receipt and validator input
contracts/checkpoints/exact-navigation.v1.json
fixtures/exact-navigation/                 A3 only: bundled deterministic inputs
android-app/                               A3 only: one Compose screen + recording effect port
ios-app/                                   A3 only: one SwiftUI screen + recording effect port
runtime/                                   A5 only if measured feedback earns it
evidence/runtime/exact-navigation/         A6 generated artifacts, not product state
reviews/exact-navigation/                  A7 receipts only after A6
```

KMP source remains an exact read-only CI checkout and is never vendored.

## Issue audit

### Issue #1 — domain parity kernel

The implementation is verified but the issue body predates the exact KMP reference. It still needs
a completion record containing `VERIFIED_UNMERGED`, Draft PR #2, the implementation head, exact CI
URL, rollback, and the single repository fact promoted. Do not reopen its implementation scope.

### Issue #4 — exact KMP reference replay

The body still says `READY` although Draft PR #5 is green. Update it to `VERIFIED_UNMERGED` and bind
the current exact lab head, CI runs, receipt artifact digest, and promoted fact
`KMP_REFERENCE_UNIT_REPLAY`. Keep the issue open while merge remains human-owned.

### Issue #3 — plan hash gate

This is the current blocker. Before execution its issue must contain:

- the current Draft PR #5 head and tree, not the older domain implementation SHA;
- the exact plan path and receipt path;
- exact UTF-8 bytes as the hash input, with no canonicalization in the first version;
- stable RED fingerprint `PLAN_HASH_MISMATCH`;
- exact local GREEN/RED commands and the `npm test` CI command;
- dependency on verified Issue #4 / Draft PR #5;
- promoted repository fact `APPROVAL_BINDS_EXACT_PLAN_BYTES`.

### A3–A7

Do not file them as a batch. A3 is filed only after #3 passes. A4 is filed only after a failure is
physically observed. A5 is filed only after feedback latency or opacity is measured. A6 is filed
after a named runtime event window exists. A7 is filed after A6 produces a complete artifact set.

## Bottleneck priority

| Priority | Work | Why it is next | Stop condition |
|---|---|---|---|
| P0 | Update and run Issue #3 | Unreviewed plan drift can invalidate every later checkpoint | Hash mismatch RED and exact-plan GREEN both pass |
| P1 | File and implement A3 exact-navigation checkpoint | Creates the first physical UI subject without requiring complete KMP | Compose and SwiftUI satisfy four bounded controls |
| P2 | File A4 from the first observed failure | Converts speculation into the smallest real defect | Reproducer is stable and the defect is closed |
| Conditional | A5 | Only useful if A3 feedback is measurably slow or opaque | Do not file if existing emitters suffice |
| Conditional | A6 | Requires named runtime artifacts from A3 | No KMP runtime claim without KMP runtime evidence |
| Conditional | A7 | Requires A6 evidence and human/reviewer inputs | Any changed artifact invalidates approval |

Issues #1 and #4 are verified work awaiting human merge; they are not current engineering
bottlenecks. Do not spend the next implementation wave expanding them.

## A3 minimum implementation

Shared inputs are limited to checkpoint ID, behavior states, fixtures, accessibility identifiers,
expected events, and evidence schema. Kotlin and Swift own their implementations.

The first version uses recording effect ports and bundled local data. It must reject:

1. dispatch without approval;
2. duplicate dispatch for one operation ID;
3. approval after page generation changes;
4. callback success followed by a mismatched observed destination.

No external URL, credential, production origin, telemetry upload, upstream write, automatic merge,
or release is admitted. A real Android WebView and iOS WKWebView enter only when A6 is earned.

## Execution order

```text
#1 / Draft PR #2: domain parity kernel — VERIFIED_UNMERGED
  → #4 / Draft PR #5: exact KMP unit replay — VERIFIED_UNMERGED
  → #3: exact-plan approval binding — NEXT
  → A3: one exact-navigation Compose/SwiftUI checkpoint
  → A4: first observed migration failure
  → A5 only if feedback is the measured bottleneck
  → A6 when named runtime artifacts exist
  → A7 when the A6 artifact set can be bound and reviewed
```

## Stop conditions

Stop and return to N-class if:

- the exact KMP commit/tree or required paths do not match;
- upstream evidence is promoted beyond `PLAY_SAFE_WEBVIEW_COMPILE_PACKAGE_ONLY`;
- the plan approval is not bound to exact bytes and the current stacked subject;
- the atom needs production data, credentials, upstream writes, or external navigation;
- acceptance depends only on an Agent or human saying the output looks correct;
- GREEN has no planted RED with a stable failure fingerprint;
- a proposed abstraction is not required by the first migrated screen or observed failure;
- an available static-contract receipt is presented as KMP runtime evidence;
- the result would exceed the issue's evidence ceiling.
