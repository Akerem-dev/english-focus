# Interface polish and friendly errors — Phase 2

Status: implemented on `feat/interface-polish-and-friendly-errors`

## Scope

This phase corrects the Library row alignment and replaces the conventional CEFR chip treatment with a quieter typographic level marker.

## Completed

- Assigned the Level column a stable width so its heading and values share the same center line.
- Centered every CEFR value directly beneath the Level heading.
- Removed the pill border, background, padding, and chip silhouette from Library CEFR values.
- Kept CEFR color meaning while presenting the level as restrained display text.
- Aligned the book icon with the word's first line instead of the combined word-and-part-of-speech block.
- Applied a one-pixel optical adjustment to the word line for a more natural baseline.
- Kept the row structure, selection behavior, navigation, filtering, sorting, and export behavior unchanged.

## Design boundary

The Library row uses typography and column alignment instead of decorative badges or micro-cards. No gradients, glow effects, floating controls, ornamental pills, or generic AI-generated dashboard styling were added.

## Safety boundary

- No Library data changes.
- No vocabulary schema changes.
- No CEFR meaning changes.
- No navigation changes.
- No selection or export behavior changes.

## Next phase

Phase 3 will add a restrained ambient letter-and-dictionary background with an immediately accessible motion switch and reduced-motion safeguards.
