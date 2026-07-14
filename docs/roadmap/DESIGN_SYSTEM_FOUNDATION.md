# Design system foundation

## Visual direction

English Focus uses a calm editorial desktop aesthetic:

- warm off-white canvas;
- near-white reading surfaces;
- charcoal text;
- one controlled burgundy accent;
- subtle neutral borders;
- restrained elevation;
- serif display type only for brand and major vocabulary headings;
- clean system sans-serif for application controls and body copy.

The interface must not use gradients, glassmorphism, neon effects, AI sparkle motifs, gamification visuals, or arbitrary color variants.

## Sources of truth

- Runtime-safe TypeScript tokens: `apps/desktop/src/design-system/tokens/designTokens.ts`
- CSS custom properties: `apps/desktop/src/styles/tokens.css`
- Typography rules: `apps/desktop/src/styles/typography.css`
- SVG icon system: `apps/desktop/src/design-system/icons`

Feature components must consume semantic aliases such as `--color-accent`, `--color-surface`, and `--color-text` rather than hard-coded product colors.

## Icon rules

- Icons are inline SVG.
- Icons use `currentColor`.
- Default icons are decorative and hidden from assistive technology.
- An icon with a supplied `label` becomes an accessible image.
- Icon-only buttons must still provide their own accessible name.
- PNG/JPG assets are not used for interface controls.

## Motion rules

Interaction motion is limited to 120–240 ms. Both the operating-system reduced-motion preference and the application `data-reduced-motion="true"` state disable nonessential motion.

## Narrow-window contract

The implementation uses three documented width thresholds:

- compact: 720 px;
- narrow desktop: 960 px;
- wide desktop: 1280 px.

CSS media queries use literal values matching these tokens because CSS custom properties are not valid media-query operands in standard browser support.
