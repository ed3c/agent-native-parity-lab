# N-001 atoms

## Issue admission contract

Every filed issue must include:

1. observed failure or bottleneck;
2. exact subject commit;
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

Issue #1 already had scope, non-goals, acceptance, negative controls, and an evidence ceiling. It did
not explicitly include state/dependencies, exact command/output requirements, a stable failure
fingerprint, rollback, or a promotion target. New issues use the full contract.

## Filed atoms

### N-001-A0 — domain parity kernel

- Issue: [#1](https://github.com/ed3c/agent-native-parity-lab/issues/1)
- Delivery: [Draft PR #2](https://github.com/ed3c/agent-native-parity-lab/pull/2)
- State: `VERIFIED` at commit `c7b0d1398432a9899831bbeecaa2b581c392333a`
- Ceiling: `LOCAL_DETERMINISTIC_DOMAIN_PARITY`
- Human merge: pending

### N-001-A1 — plan hash approval

- Issue: [#3](https://github.com/ed3c/agent-native-parity-lab/issues/3)
- State: `READY`
- Bottleneck: plan approval survives plan drift
- RED: mutate behavior-bearing plan content after approval
- Ceiling: `LOCAL_PLAN_APPROVAL_BINDING`
- Priority: run first

### N-001-A2 — one real three-platform screen

- Issue: [#4](https://github.com/ed3c/agent-native-parity-lab/issues/4)
- State: `BLOCKED` by #3 and human acceptance of Draft PR #2
- Bottleneck: no physical UI/runtime subject
- RED: change one platform's event order, accessibility identifier, or dispatch count
- Ceiling: `LOCAL_THREE_PLATFORM_SCREEN_CHECKPOINT`
- Priority: highest product bottleneck; run immediately after A1

## Unfiled atoms

These are hypotheses, not backlog commitments.

### N-001-A3 — first real migration failure

Exercise A2 and record the first failure in source investigation, platform planning, UI behavior,
analytics, accessibility, lifecycle, or build feedback. File only the smallest issue that reproduces
that failure. Do not create a generic Pi extension.

### N-001-A4 — headless runtime CLI

Admit `inspect`, `run-fixture`, and structured JSONL output only if A2 proves static evidence is
too slow or cannot explain a failure. No daemon, socket protocol, simulator remote mode, or
dashboard in the first CLI atom.

### N-001-A5 — named runtime evidence

Compare one named checkpoint's screenshot and event window. Normalize only explicitly whitelisted
nondeterministic fields and verify event-to-page/entity relationships. Plant one wrong relationship
that must fail.

### N-001-A6 — checkpoint review receipts

Bind test evidence, visual evidence, two independent review receipts, human approval, checkpoint ID,
and subject commit. Any changed artifact or commit invalidates the gate. This is a minimal
behavioral analogue of the public Helix loop, not Helix source reproduction.

### N-001-A7 — one outcome metric

Measure only the bottleneck observed after A2: build time, startup time, package size, stability, or
rendering. Do not build a full benchmark suite before one metric changes a decision.

## Filing rule

Only A1 is `READY`. A2 may start after its blockers close. A3–A7 remain unfiled until the preceding
runtime evidence exists.
