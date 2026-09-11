# Agent operating contract

## Purpose

This repository tests one claim: two independent native implementations can stay behaviorally
aligned through a shared contract and executable evidence. It is inspired by Shopify's public
migration method; it is not Shopify code and must not claim to reproduce private Helix, Tardis,
or Pi extension internals.

## Read order

1. `AGENTS.md`
2. `README.md`
3. `contracts/navigation-gate.v1.json`
4. Exact issue, branch, diff, and CI result

## Hard boundaries

- Android Kotlin and iOS Swift are independent implementations. Neither may import the other.
- Shared files may define behavior, fixtures, evidence shape, and comparison only.
- Tests use local deterministic identifiers. No production URL, account, credential, or network
  mutation is admitted.
- A proposal is not execution authority. Exact human approval must precede dispatch.
- Platform callback success is not outcome proof. A mismatched postcondition is `UNKNOWN`.
- An operation identifier may dispatch at most once.
- Page-generation drift or direct user input preempts pending Agent work.
- Agents may create issue-scoped branches and draft PRs. Merge and release remain human-owned.

## Evidence states

```text
PASS
FAIL
ABSENT
NOT_IMPLEMENTED
NOT_EXERCISED
UNKNOWN
EXTERNAL_AUTHORITY_REQUIRED
```

Green CI for the first atom proves only deterministic domain parity. It does not prove WebView,
WKWebView, simulator, device, production, cost, or Shopify-equivalent results.

## Fixed verification commands

```bash
node harness/validate-contract.mjs
gradle :android-domain:test
gradle -q :android-domain:run > evidence/android.json
swift test --package-path ios-domain
swift run --package-path ios-domain EmitEvidence > evidence/ios.json
node harness/compare-evidence.mjs evidence/android.json evidence/ios.json
```

Every nontrivial change requires a positive path and a planted negative control that fails when
the protected invariant is removed.
