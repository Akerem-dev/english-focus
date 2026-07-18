# Simplified Vocabulary — Phase 5

Status: implemented on `feat/simplified-vocabulary-experience`

## Completed

- Removed the descriptive Library subtitle.
- Moved the alphabet directly below the page heading and increased letter size.
- Removed the large controls card around the alphabet and search field.
- Added a lighter search treatment below the alphabet.
- Removed the Library layer filter.
- Removed the Library learning-status filter.
- Kept CEFR, favorites, and sort controls in a compact collapsible strip.
- Added a reusable CEFR badge with a restrained level-specific color treatment.
- Moved CEFR to the far-right table column.
- Replaced the browser-default checkbox with a custom keyboard-accessible selection control.
- Removed the Library preview panel and widened the vocabulary list.
- Clicking a word now opens its full Vocabulary detail route.
- Checkbox interaction only changes selection and never opens the word.
- Hidden learning/review values are no longer included in Library text search.

## Compatibility

Storage layers and legacy learning/review metadata remain intact internally. This phase removes only their Library controls and search visibility; it does not rewrite existing SQLite records.

## Manual actions

No files need to be deleted manually in this phase.
