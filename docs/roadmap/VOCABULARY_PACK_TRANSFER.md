# CP17 Vocabulary-pack transfer

## Goal

Move multiple user-owned vocabulary entries between English Focus installations without introducing cloud storage, provider-specific APIs, or unsafe direct database copying.

## Pack contract

A pack is a versioned JSON envelope:

- `kind`: `english-focus-vocabulary-pack`
- `packVersion`: `1.0.0`
- `schemaVersion`: vocabulary schema version used by its entries
- `createdAt`: ISO timestamp
- `entryCount`: exact number of entries
- `entries`: versioned vocabulary objects

## Safety limits

- Maximum 500 entries per pack
- Maximum 5,242,880 text characters
- Local-only file reading and validation
- Duplicate normalized words inside the pack are invalid
- No SQLite write begins until the review strategy is confirmed

## Import strategies

### Invalid entries

- Skip invalid entries and report them
- Block the entire import until the pack is completely valid

### Existing entries

- Keep existing local entries
- Replace existing content using the correct user or override layer

User metadata remains separate from vocabulary content and is not erased by replacement.

## Summary

The final screen reports:

- entries added
- entries replaced
- existing entries skipped
- invalid entries skipped
- save failures
