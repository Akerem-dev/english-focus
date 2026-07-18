# Simplified Vocabulary — Phase 3

Status: implemented on `feat/simplified-vocabulary-experience`

## Completed

- Vocabulary detail navigation now contains only Overview, Meanings, Examples, and optional Etymology.
- The detail screen keeps the essential learning information: translation, CEFR, part of speech, registers, pronunciation, word forms, short usage summary, meanings, three examples, and optional etymology.
- Grammar patterns, tense examples, sentence forms, preposition patterns, word family, collocations, related words, and common mistakes were removed from the detail presentation.
- Known, Reviewed, and Editorially reviewed status chips were removed from the vocabulary header.
- Personal details now contain only favorites, tags, notes, and activity information.
- Legacy learning and review values remain preserved internally when personal details are saved, but they are no longer editable or displayed.
- Common-mistake and word-family controls were removed from Settings and AI instruction settings.
- New AI instructions explicitly keep removed compatibility fields empty.
- Obsolete detail-only section component files were deleted after their final references were removed.

## Compatibility boundary

The V1 domain fields remain temporarily available for legacy JSON input and local storage compatibility. This phase removes their presentation and generation requirements; a later repository-wide cleanup phase will remove the remaining schema and domain types after migration coverage is complete.

## Manual actions

Git users should not delete files manually; `git pull` applies the deletions. Anyone applying the ZIP by hand must delete the files listed in `DELETE_THESE_FILES.txt`.
