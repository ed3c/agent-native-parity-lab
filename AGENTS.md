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
5. The relevant `docs/n-class/<N-id>/` files only when planning unverified work

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
- Do not mutate `ed3c/kotlin-auto-webview`. KMP is a pinned CI checkout only.

## N-class documents

N-class documents contain hypotheses and blocked work. They do not authorize code changes, expand
side effects, or override an issue. Only a `READY` atom with an exact subject, deterministic GREEN,
planted RED, evidence ceiling, and rollback path may become an implementation issue. Verified
behavior may be promoted from N-class only after exact-subject evidence and review.

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

## Runtime class vocabulary (do not confuse)

```text
HOST        JVM unit test / SwiftPM macOS host process
EMULATOR    Android instrumentation on a managed emulator
SIMULATOR   iOS XCTest on an iOS Simulator destination (xcodebuild)
PHYSICAL    Forbidden in this lab atom; Human local-computer gate later
```

HOST must never be relabeled as SIMULATOR/EMULATOR. Primary ANDROID_NATIVE / IOS_NATIVE CI
artifacts for simulator-elevation must carry `runtime_class=EMULATOR` / `SIMULATOR` respectively.

## Evidence ceiling ladder

```text
BUILD_PARITY
  → CONTRACT_PARITY
  → HOST_TEST_PARITY
  → SIMULATOR_RUNTIME_PARITY     # ceiling for SIMULATOR_RUNTIME_ELEVATION
  → PHYSICAL_DEVICE_PARITY       # FORBIDDEN unless a later Human gate says otherwise
```

Green CI for the first atom proves only deterministic domain parity. It does not prove WebView,
WKWebView, physical device, production, cost, or Shopify-equivalent results.

`KMP_NATIVE_RUNTIME_PROBE` measures three subjects against `exact-navigation.v1`. ABSENT KMP on
pin `bcb79473…` remains a valid probe outcome — do not fake KMP PASS. Do not invent A4 unless the
comparator yields a stable reproducible mismatch fingerprint on the exact subject.

Maximum claim when elevated natives are green and KMP remains ABSENT:
`SIMULATOR_RUNTIME_PARITY_NATIVE_WITH_KMP_ABSENT`.

## Fixed verification commands

```bash
node harness/validate-contract.mjs
gradle :android-domain:test
gradle -q :android-domain:run > evidence/android.json
swift test --package-path ios-domain
swift run --package-path ios-domain EmitEvidence > evidence/ios.json
node harness/compare-evidence.mjs evidence/android.json evidence/ios.json
node harness/validate-runtime-envelope.mjs --selftest
node --test harness/validate-runtime-envelope.test.mjs
```

Runtime probe (CI matrix in `.github/workflows/kmp-native-runtime-probe.yml`):

```bash
node harness/kmp-runtime-probe.mjs <kmp-checkout> fixtures/exact-navigation/checkpoint.json evidence/kmp.json android
RUNTIME_ENVELOPE_OUT=evidence/android-native-host-envelope.json gradle :android-app:testDebugUnitTest --tests 'dev.ed3c.nativeparity.checkpoint.ExactNavigationRuntimeEnvelopeTest'
# Emulator instrumentation (CI): connectedDebugAndroidTest → runtime_class=EMULATOR
RUNTIME_ENVELOPE_OUT=evidence/ios-native-host-envelope.json swift test --package-path ios-app --filter ExactNavigationRuntimeEnvelopeTests
# Simulator XCTest (CI): xcodebuild -destination 'platform=iOS Simulator,...' → runtime_class=SIMULATOR
node harness/compare-runtime-envelopes.mjs evidence/android-native-envelope.json evidence/ios-native-envelope.json evidence/kmp.json
```

Every nontrivial change requires a positive path and a planted negative control that fails when
the protected invariant is removed.
