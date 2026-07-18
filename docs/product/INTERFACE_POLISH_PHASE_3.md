# Interface polish and friendly errors — Phase 3

Status: implemented on `feat/interface-polish-and-friendly-errors`

## Scope

This phase adds a restrained Library atmosphere with a small motion control while respecting the application's reduced-motion preference.

## Completed

- Added a sparse, fixed composition of small letters and book symbols behind the Library content.
- Used very low opacity and slow, short-distance movement so reading remains the visual priority.
- Added a compact burgundy Animation switch at the lower-right edge of the application.
- Stores the Library motion choice locally and restores it when the application is opened again.
- Keeps the decorative symbols visible but still when animation is switched off.
- Automatically disables ambient movement when Reduced motion is enabled in Settings.
- Added a system `prefers-reduced-motion` fallback that removes animation and switch transitions.
- Kept all atmosphere elements outside the accessibility tree and interaction flow.
- Added route coverage for the atmosphere and motion control.
- Verified the final phase commit with the repository Quality workflow.

## Design boundary

The atmosphere is a curated typographic layer, not a particle effect. It uses no random generation, gradients, glow, blur clouds, floating cards, large illustrations, or generic AI-generated decoration. Movement is deliberately slow and limited to a few pixels.

## Safety boundary

- No Library data changes.
- No settings schema or migration changes.
- No navigation, filtering, selection, or export behavior changes.
- The preference uses a dedicated local UI key and does not modify vocabulary storage.

## Next phase

Phase 4 will repair the `safetyBackup: null` compatibility problem and replace remaining technical activity and data-summary errors with calm user-facing recovery messages.
