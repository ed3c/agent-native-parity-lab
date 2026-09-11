# exact-navigation checkpoint plan

## Bound subjects

- KMP source commit: `bcb79473eaa6bb2e09f287462aa932a7fdab4957`
- KMP source tree: `9fe624d903c429940cd8de0bd05bdf66fd63e4a1`
- Lab parent commit: `1474ced5dcfb04db9d4f051d377ed17d8cb12b3d`
- Lab parent tree: `35ff632fd085b16376850ec498a381626d6bfccf`

## Behavior

- checkpoint_id: `exact-navigation`
- dispatch_limit_per_operation: `2`
- approval: exact operation ID and destination are required before dispatch
- stale_page_generation: reject before dispatch
- callback_without_matching_postcondition: `UNKNOWN`

## Planned A3 implementation boundary

- Android Kotlin and iOS Swift implementations remain independent.
- Shared material is limited to behavior, fixtures, accessibility identifiers, expected events,
  and evidence schema.
- The first implementation uses a recording effect port and bundled local fixtures.
- Real WebView, WKWebView, simulator, device, and external navigation are not admitted.

## Required controls

1. dispatch without approval is rejected;
2. duplicate dispatch for one operation ID is rejected;
3. approval after page-generation drift is rejected;
4. callback success with a mismatched destination becomes `UNKNOWN`.

## Evidence ceiling

Approval of this plan can authorize an A3 implementation issue only. It does not prove plan
quality, reviewer identity, native runtime parity, KMP runtime parity, merge, release, or
production readiness.
