# CP07 — Search Vertical Slice

## Purpose

CP07 turns the read-only `maintain` entry into a deterministic local search flow without adding SQLite, network access, or an embedded AI provider.

## Implemented query pipeline

1. Unicode NFKC normalization.
2. Smart-apostrophe normalization.
3. Dash and hyphen normalization.
4. Whitespace collapse and trim.
5. English locale case folding.
6. Single-word and supported-character validation.
7. Exact normalized-word lookup.
8. Alias and inflected-form lookup.
9. Bounded fuzzy suggestions for close valid misses.
10. Explicit found, not-found, invalid, searching, typing, and repository-error states.

## Supported acceptance matrix

| Input | Expected result |
| --- | --- |
| `maintain` | exact found |
| ` Maintain ` | exact found |
| `MAINTAIN` | exact found |
| `maintains` | alias found → `maintain` |
| `maintained` | alias found → `maintain` |
| `maintaining` | alias found → `maintain` |
| `allocate` | valid not-found |
| `maintan` | valid not-found with `maintain` suggestion |
| `maintain?` | invalid |
| `two words` | invalid |
| blank | invalid |

## Deliberate boundaries

- The search source remains the validated in-memory core content source.
- SQLite and FTS5 arrive in the persistent-search phase.
- Not-found actions for AI instruction and JSON paste are visible but disabled until their own checkpoints.
- No fake network delay is introduced. The searching state is scheduled for the next microtask so the state machine remains explicit without slowing local lookup.
- Fuzzy suggestions never auto-open an entry; the user chooses a suggestion.
