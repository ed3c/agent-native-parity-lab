# N-001 prompt: test Shopify's public migration method

## Question

Can this repository test the useful parts of Shopify's publicly described reference-to-native
migration method with independent Swift and Kotlin implementations, shared behavioral evidence,
and bounded side effects?

Shopify used React Native as its reference. This lab currently has no React Native subject, so the
first control is a real KMP application. That substitution tests the migration method and evidence
loop; it cannot prove React Native-specific cost, behavior, or economics.

## Public references

- [Native is now the future of mobile at Shopify](https://shopify.engineering/back-to-native)
- [Migrating Shop app from React Native to native](https://shopify.engineering/shop-app-migration)

The articles publicly describe:

- an existing implementation as reference for separate SwiftUI and Jetpack Compose implementations;
- small ordered screen checkpoints;
- tests, visual review, two adversarial reviews, and human approval;
- specialized migration roles for source inspection, behavior documentation, platform planning,
  implementation, and parity review;
- plan acceptance bound to a content hash;
- structured runtime events, logs, state, and commands;
- named screenshot and event windows with relationship-aware comparison;
- headless business logic and a CLI before simulator interaction;
- multiple worktrees, repository guidance, lint, static analysis, performance checks, and review;
- startup, stability, app size, build time, rendering, accessibility, analytics, and product
  continuity as outcome measures.

## Unknown and forbidden claims

Shopify has not published the Helix or Tardis source, Pi extension prompts, repository shape,
platform state architecture, reviewer configuration, code-generation policy, model mix, token
costs, or complete Agent contribution ratio. This lab must not label inferred Redux, MVI, Clean
Architecture, KMP, Rust, prompts, or orchestration as Shopify's implementation.

KMP is this lab's first reference control only. It is not attributed to Shopify.

## Pinned current subjects

### Lab parent

- Repository: `ed3c/agent-native-parity-lab`
- Parent head: `8836205ee8cb67fc3a50c4b58b103f86291e44b6`
- Existing proof: `LOCAL_DETERMINISTIC_DOMAIN_PARITY`

### KMP reference

- Repository: `ed3c/kotlin-auto-webview`
- Issue / Draft PR: `#72 / #156`
- Selected head: `bcb79473eaa6bb2e09f287462aa932a7fdab4957`
- Selected tree: `9fe624d903c429940cd8de0bd05bdf66fd63e4a1`
- State: `LEAF_COMPLETE_UNMERGED`
- Upstream ceiling: `PLAY_SAFE_WEBVIEW_COMPILE_PACKAGE_ONLY`

## Hard boundaries

- The KMP source is checked out read-only at the exact commit and is never vendored or edited.
- Shared behavior and evidence are allowed; shared mobile runtime implementation is not copied into
  the future native targets.
- Use bundled fixtures until an issue explicitly earns a larger effect boundary.
- No credential, production URL, account mutation, telemetry upload, upstream write, merge, or
  release.
- One checkpoint must fail usefully before generalized tooling is admitted.
- A green check may claim only the evidence ceiling declared by its issue.
