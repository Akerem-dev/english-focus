# CP04B — Accessible Component Foundation

## Objective

Replace the final-skeleton UI boundaries needed by the application shell with a small, dependency-free, accessible React component foundation.

## Implemented component groups

- Actions: `Button`, `IconButton`
- Forms: `TextField`, `TextAreaField`, `SearchInput`, `SelectField`, `SwitchField`
- Layout: `Stack`, `Inline`, `Divider`, `ContentColumn`, `PageHeader`
- Data: `StatusBadge`, `TagChip`
- Feedback: `InlineError`, `EmptyState`, `ErrorState`, `LoadingSkeleton`
- Disclosure: `Section`, `SectionHeader`

## Accessibility contract

1. Every icon-only action requires an accessible label.
2. Every field owns a deterministic label association.
3. Helper and validation content is referenced with `aria-describedby`.
4. Invalid fields expose `aria-invalid` and an alert message.
5. Switches use a native checkbox with `role="switch"`.
6. Focus appearance comes from the shared token system.
7. Disabled and loading states remain semantically disabled.
8. Reduced-motion preferences stop nonessential animation.

## Styling rules

- Components only consume semantic design tokens.
- No component introduces a gradient except the neutral loading skeleton shimmer.
- No component introduces glass, glow, or AI-style decoration.
- All SVG icons use `currentColor`.
- Components remain usable at the 960 px minimum native window width and in the browser narrow-window regression test.

## Deliberately deferred

- Modal focus trapping
- Toast lifecycle management
- Accordion state management
- App shell and route navigation
- Domain-specific vocabulary components

These belong to later roadmap checkpoints and are not hidden inside the primitive layer.
