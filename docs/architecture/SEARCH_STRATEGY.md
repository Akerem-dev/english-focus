# Search Strategy

Priority:

1. Exact normalized English word
2. Alias or inflected English form
3. Ranked prefix match
4. Ranked full-text match
5. Fuzzy spelling suggestion for a single English word

Searchable fields:

- word and normalized word;
- aliases and declared inflected forms;
- Turkish translations;
- English definitions;
- user-owned tags;
- user-owned notes.

The active vocabulary and metadata are combined into an immutable local search index whenever either
source changes. Search terms are Unicode-normalized, case-insensitive, and folded for Turkish
diacritics, so `sürdürmek` and `surdurmek` resolve through the same index. Exact and alias lookups
still open an entry immediately. Prefix and full-text queries return ranked local matches for the user
to choose from.

No search text, personal tag, or note leaves the device.
