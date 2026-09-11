# Agent Native Parity Lab

An evidence-first experiment for maintaining two independent native implementations:

- Android: Kotlin
- iOS: Swift
- Shared: behavior contract, fixtures, evidence shape, and comparison
- Reference only: `ed3c/kotlin-auto-webview@d87693c05bd00e0092e7e50ebd31f38dfc486874`

The first vertical slice solves a real authority problem: an Agent may propose navigation, but
only an exact human approval may dispatch it, and a platform callback is not accepted as proof
until the postcondition is observed.

## First checkpoint

```text
IDLE
→ WAITING_FOR_CONFIRMATION
→ EXECUTING
→ VERIFYING
→ APPLIED | UNKNOWN
```

Both implementations must reject or contain:

1. dispatch before approval;
2. repeated dispatch of the same operation;
3. approval after the page generation changed;
4. callback success followed by a mismatched postcondition.

## Repository shape

```text
contracts/       shared behavior, never shared implementation
android-domain/  independent Kotlin state machine and tests
ios-domain/      independent Swift state machine and tests
harness/         contract validation and normalized evidence comparison
evidence/        generated output; only `.gitkeep` is tracked
```

## Run

```bash
node harness/validate-contract.mjs
node --test harness/*.test.mjs
```

Kotlin and Swift verification run in GitHub Actions. Exact commands are recorded in `AGENTS.md`
and `.github/workflows/ci.yml`.

## Evidence ceiling

A green run proves local deterministic parity and that the four negative controls discriminate
the protected behavior. Native WebView/WKWebView adapters, screenshots, simulator/device evidence,
performance comparison, and total-cost claims remain `NOT_IMPLEMENTED` or `NOT_EXERCISED`.

This project is an independent experiment based on public engineering descriptions. It is not
affiliated with or endorsed by Shopify.
