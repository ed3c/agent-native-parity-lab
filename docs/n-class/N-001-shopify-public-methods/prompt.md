# N-001 prompt: test Shopify's public migration method

## Question

Can this repository test the useful parts of Shopify's publicly described React Native-to-native
migration method with independent Swift and Kotlin implementations, shared behavioral evidence,
and bounded side effects?

This is a feasibility experiment, not a Shopify implementation.

## Public references

- [Native is now the future of mobile at Shopify](https://shopify.engineering/back-to-native)
- [Migrating Shop app from React Native to native](https://shopify.engineering/shop-app-migration)

The articles publicly describe:

- React Native as the reference for separate SwiftUI and Jetpack Compose implementations;
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

## Pinned current subject

- Repository: `ed3c/agent-native-parity-lab`
- Baseline: `c7b0d1398432a9899831bbeecaa2b581c392333a`
- Existing proof: `LOCAL_DETERMINISTIC_DOMAIN_PARITY`
- Read-only control: `ed3c/kotlin-auto-webview@d87693c05bd00e0092e7e50ebd31f38dfc486874`

## Hard boundaries

- Shared behavior and evidence are allowed; shared mobile runtime implementation is not.
- Use bundled fixtures until an issue explicitly earns a larger effect boundary.
- No credential, production URL, account mutation, telemetry upload, merge, or release.
- One checkpoint must fail usefully before generalized tooling is admitted.
- A green check may claim only the evidence ceiling declared by its issue.
