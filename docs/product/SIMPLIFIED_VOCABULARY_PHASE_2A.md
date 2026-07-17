# Simplified Vocabulary — Phase 2A

Status: implemented on `feat/simplified-vocabulary-experience`

## Completed in this slice

- Vocabulary detail pages now show at most the first three primary examples.
- The `Exactly 10` / result-count chip was removed from the example section.
- The example section description was shortened.
- Content settings no longer offer 5-versus-10 example controls; the visible policy is fixed to the first three examples.
- The redundant `Primary examples — Exactly 10` row was removed from AI instruction settings.
- Component tests were updated to verify three visible examples and the absence of `Exactly 10` copy.

## Compatibility boundary

The stored vocabulary and JSON contracts still retain their existing ten-example-compatible structure in this slice. Existing local entries and imported packs are therefore not rewritten or invalidated. The next Phase 2 slice will introduce the compatibility reader and simplified three-example write contract before old fields are removed.

## Manual actions

No files should be deleted manually for this slice.
