# N-001 atoms

## Issue admission contract

Every filed issue must include:

1. observed failure or bottleneck;
2. exact subject commit and tree where external or stacked;
3. `READY` or `BLOCKED` state and physical dependencies;
4. one behavior-sized goal;
5. explicit non-goals;
6. admitted and forbidden side effects;
7. deterministic GREEN acceptance;
8. planted RED control and stable failure fingerprint;
9. evidence artifacts, exact commands, exit codes, and CI URL;
10. evidence ceiling;
11. rollback or reconciliation path;
12. the repository fact the evidence may promote.

## Filed atoms

### N-001-A0 — domain parity kernel

- Issue: [#1](https://github.com/ed3c/agent-native-parity-lab/issues/1)
- Delivery: [Draft PR #2](https://github.com/ed3c/agent-native-parity-lab/pull/2)
- State: `VERIFIED` at implementation head `c7b0d1398432a9899831bbeecaa2b581c392333a`
- Ceiling: `LOCAL_DETERMINISTIC_DOMAIN_PARITY`
- Human merge: pending

### N-001-A1 — exact KMP reference replay

- Issue: [#4](https://github.com/ed3c/agent-native-parity-lab/issues/4)
- Source: `ed3c/kotlin-auto-webview#156@bcb79473eaa6bb2e09f287462aa932a7fdab4957`
- State: `READY`
- Bottleneck: no bound, reproducible migration reference in the lab
- GREEN: exact commit/tree validation plus existing Play-safe Android unit-test replay
- RED: wrong commit, tree, path, state, or evidence promotion
- Ceiling: `KMP_REFERENCE_UNIT_REPLAY`
- Priority: run first

### N-001-A2 — plan hash approval

- Issue: [#3](https://github.com/ed3c/agent-native-parity-lab/issues/3)
- State: `READY, QUEUED_AFTER_A1`
- Bottleneck: plan approval survives plan drift
- RED: mutate behavior-bearing plan content after approval
- Ceiling: `LOCAL_PLAN_APPROVAL_BINDING`
- Priority: required before native migration implementation

## Unfiled atoms

These are hypotheses, not backlog commitments.

### N-001-A3 — one independent native checkpoint

After A1 and A2 pass, select exactly one KMP behavior checkpoint and implement it separately in:

- Android Kotlin + Jetpack Compose;
- iOS Swift + SwiftUI.

Shared inputs are limited to behavior specification, fixtures, accessibility expectations, event
contracts, and evidence schema. KMP code is not imported, translated into a shared module, or
vendored.

### N-001-A4 — first real migration failure

Exercise A3 and record the first failure in source investigation, platform planning, UI behavior,
analytics, accessibility, lifecycle, or build feedback. File only the smallest issue that reproduces
that failure. Do not create a generic Pi extension.

### N-001-A5 — headless runtime CLI

Admit `inspect`, `run-fixture`, and structured JSONL output only if A3 proves static evidence is
too slow or cannot explain a failure. No daemon, socket protocol, simulator remote mode, or
dashboard in the first CLI atom.

### N-001-A6 — named runtime evidence

Compare one named checkpoint's screenshot and event window. Normalize only explicitly whitelisted
nondeterministic fields and verify event-to-page/entity relationships. Plant one wrong relationship
that must fail.

### N-001-A7 — checkpoint review receipts

Bind test evidence, visual evidence, two independent review receipts, human approval, checkpoint ID,
and subject commit. Any changed artifact or commit invalidates the gate. This is a minimal
behavioral analogue of the public Helix loop, not Helix source reproduction.

### N-001-A8 — one outcome metric

Measure only the bottleneck observed after A3: build time, startup time, package size, stability, or
rendering. Do not build a full benchmark suite before one metric changes a decision.

## Filing rule

Only A1 and A2 are `READY`; A1 runs first. A3–A8 remain unfiled until their preceding evidence
exists.
