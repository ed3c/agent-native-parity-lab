# N-class working documents

N-class documents hold unverified architecture hypotheses and the smallest path to test them.
They are not repository truth and do not override `AGENTS.md`, executable contracts, or observed CI
evidence.

## Shape

Each class contains only three files:

- `prompt.md`: stable question, public sources, subject, and hard boundaries;
- `plan.md`: observed gaps, dependency order, and stop conditions;
- `atoms.md`: falsifiable work units and their admission state.

Do not add generated transcripts, generic prompts, dashboards, or tool-specific orchestration here.

## States

- `OBSERVED`: directly supported by repository or cited public evidence.
- `INFERRED`: a design inference that still needs a test.
- `READY`: one bounded atom has an available subject and verifier.
- `BLOCKED`: a named physical dependency is absent.
- `VERIFIED`: exact-subject GREEN and planted RED evidence exist.

## Promotion path

```text
N-class hypothesis
→ READY atom
→ issue
→ exact-subject GREEN + planted RED
→ reviewed Draft PR
→ repository contract or implementation
```

Only the next executable atom is filed. Later atoms remain in `atoms.md` until their dependency is
physical. Private Shopify implementation details must never be invented to fill a gap.
