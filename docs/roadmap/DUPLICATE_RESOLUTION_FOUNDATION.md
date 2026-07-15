# CP13 — Duplicate resolution foundation

CP13 adds the explicit decision gate between an approved vocabulary preview and later local persistence.

## Detection scope

The current checkpoint checks the immutable core vocabulary source by normalized word. The same comparison model is designed to accept the user repository when SQLite persistence arrives.

## Outcomes

- `new-entry`: no current normalized-word collision exists;
- `duplicate`: existing and imported entries are compared side by side.

## Explicit duplicate choices

1. `keep-existing`
2. `replace-with-imported`
3. `merge-compatible-content`

The safe merge policy keeps imported meanings, morphology, and exactly ten reviewed examples authoritative. Optional supporting sections fall back to the existing entry only when the imported section is empty.

User-owned favorites, tags, notes, learning status, and review history are not embedded in vocabulary content and remain preserved separately.

## Persistence boundary

CP13 records an in-memory resolution plan only. It does not write to SQLite, replace core data, or add a Library row. Persistence begins in CP14.
