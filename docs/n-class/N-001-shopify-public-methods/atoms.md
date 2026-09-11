# N-001 atoms

## Issue admission contract

Every filed issue must include:

1. observed failure or bottleneck;
2. exact subject commit and tree where external or stacked;
3. `READY`, `BLOCKED`, or `VERIFIED_UNMERGED` state and physical dependencies;
4. one behavior-sized goal;
5. explicit non-goals;
6. admitted and forbidden side effects;
7. deterministic GREEN acceptance;
8. planted RED control and stable failure fingerprint;
9. evidence artifacts, exact commands, exit codes, and CI URL;
10. evidence ceiling;
11. rollback or reconciliation path;
12. the single repository fact the evidence may promote.

## Filed atoms

### N-001-A0 — domain parity kernel

- Issue: [#1](https://github.com/ed3c/agent-native-parity-lab/issues/1)
- Delivery: [Draft PR #2](https://github.com/ed3c/agent-native-parity-lab/pull/2)
- State: `VERIFIED_UNMERGED` at implementation head `c7b0d1398432a9899831bbeecaa2b581c392333a`
- Ceiling: `LOCAL_DETERMINISTIC_DOMAIN_PARITY`
- Remaining work: completion metadata only; no implementation expansion
- Human merge: pending

### N-001-A1 — exact KMP reference replay

- Issue: [#4](https://github.com/ed3c/agent-native-parity-lab/issues/4)
- Delivery: [Draft PR #5](https://github.com/ed3c/agent-native-parity-lab/pull/5)
- Source: `ed3c/kotlin-auto-webview#156@bcb79473eaa6bb2e09f287462aa932a7fdab4957`
- State: `VERIFIED_UNMERGED` at implementation head `740103c5610814aa91e91ed826ea6d1c30afff89`
- GREEN: exact commit/tree validation plus existing Play-safe Android unit-test replay
- RED: wrong commit, tree, path, state, or evidence promotion
- Ceiling: `KMP_REFERENCE_UNIT_REPLAY`
- Remaining work: human merge only

### N-001-A2 — exact-plan approval binding

- Issue: [#3](https://github.com/ed3c/agent-native-parity-lab/issues/3)
- State: `READY, NEXT`
- Dependency: verified Draft PR #5 exact head/tree
- Bottleneck: plan approval survives behavior-bearing plan drift
- Hash input: exact UTF-8 plan bytes; no first-version canonicalization
- RED fingerprint: `PLAN_HASH_MISMATCH`
- Ceiling: `LOCAL_PLAN_APPROVAL_BINDING`
- Promoted fact: `APPROVAL_BINDS_EXACT_PLAN_BYTES`
- Priority: P0 before any native UI implementation

## Unfiled atoms

These are hypotheses, not backlog commitments.

### N-001-A3 — one independent native checkpoint

After A2 passes, implement the frozen exact-navigation checkpoint separately in Android Kotlin with
Jetpack Compose and iOS Swift with SwiftUI. Start with a recording effect port and bundled fixtures,
not a real WebView.

Shared inputs are limited to behavior specification, fixtures, accessibility identifiers, expected
events, and evidence schema. KMP code is not imported, translated into a shared module, or vendored.

- GREEN: both implementations satisfy the approved happy path and four bounded controls.
- RED: remove one platform's duplicate-operation guard; parity verification must fail.
- Ceiling before KMP runtime: `NATIVE_CONTRACT_PARITY`.
- Forbidden: external navigation, production data, KMP runtime claims.

### N-001-A4 — first real migration failure

Exercise A3 and record the first failure in platform planning, UI behavior, accessibility, lifecycle,
analytics, build feedback, or effect containment. File only the smallest issue that reproduces that
observed failure. Do not manufacture a generic Pi extension or preselect the failure category.

- Admission: a reproducible failure and exact A3 subject exist.
- GREEN: smallest fix closes the reproducer.
- RED: remove the fix and recover the stable original fingerprint.
- Ceiling: `OBSERVED_MIGRATION_FAILURE_CLOSED`.

### N-001-A5 — conditional headless runtime CLI

Admit only if A3 measures feedback latency or opacity that existing scenario emitters cannot close.
The first atom contains only `inspect`, `run-fixture`, and structured JSONL output.

- Do not file when existing tests and emitters are sufficient.
- No daemon, socket protocol, simulator remote mode, MCP server, database, or dashboard.
- Ceiling: `HEADLESS_FIXTURE_REPLAY`.

### N-001-A6 — named native runtime evidence

After A3 produces a runnable named checkpoint, compare one Android/iOS local fixture screenshot and
one event window. Normalize only explicitly whitelisted nondeterministic fields. Verify operation,
page generation, expected destination, and observed destination relationships. Plant one wrong
relationship that must fail.

- KMP reference kind remains `STATIC_KMP_CONTRACT` while upstream runtime evidence is absent.
- Ceiling: `NATIVE_RUNTIME_PARITY`.
- Forbidden claim: `KMP_RUNTIME_PARITY`.

### N-001-A7 — checkpoint review receipts

After A6, bind test evidence, visual evidence, event evidence, two independent review receipts,
human approval, checkpoint ID, reference kind, and all subject commits. Any changed artifact or
commit invalidates the gate.

- Required reference kind before KMP runtime: `STATIC_KMP_CONTRACT`.
- Ceiling: `NATIVE_CHECKPOINT_APPROVED`.
- A future `KMP_RUNTIME` reference requires a new A6 run and new approvals; do not promote the old
  receipt.
- This is a minimal behavioral analogue of the public Helix loop, not Helix source reproduction.

### N-001-A8 — one outcome metric

Measure only the bottleneck observed after A3: build time, startup time, package size, stability, or
rendering. Do not build a benchmark suite before one metric changes a decision.

## Filing and priority rule

1. Run A2 / Issue #3 now.
2. File A3 only after A2 is GREEN.
3. File A4 only from the first physical A3 failure.
4. File A5 only from measured feedback latency or opacity.
5. File A6 only when a named native runtime artifact exists.
6. File A7 only when A6 has a complete artifact set.

A0 and A1 are verified work awaiting human merge, not current implementation bottlenecks. KMP
completion is not an A3 prerequisite, but KMP runtime parity remains unavailable until the pinned
KMP checkpoint itself earns runtime evidence.
