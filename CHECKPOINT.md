# CP06A FIX01 — Sticky Section Navigation

Status: TESTING

This patch corrects the vocabulary detail section navigation inside the existing CP06A checkpoint.

## Fixed

- Removes the false 4.75rem gap between the application top bar and the sticky detail navigation.
- Uses an opaque navigation surface so card content no longer shows through while scrolling.
- Adds a restrained elevation while the navigation overlays long content.
- Reduces anchor clearance to the actual sticky navigation height.
- Adds a regression contract test for the sticky navigation CSS.

No vocabulary data, routes, schemas, dependencies, Rust code, or database behavior changed.
