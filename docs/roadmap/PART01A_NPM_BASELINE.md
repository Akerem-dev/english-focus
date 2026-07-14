# Part 1A — Public npm Baseline

## Goal

Establish a reproducible, public-registry-only npm installation before any application implementation begins.

## Scope

- Pin the project registry to `https://registry.npmjs.org/` through a project-level `.npmrc`.
- Reject unsupported Node.js and npm versions.
- Detect lockfiles, proxy values, or registry URLs left over from private/internal build environments.
- Generate the first `package-lock.json` only on the user's machine.

## Explicitly out of scope

- No React component changes.
- No Tauri changes.
- No dependency additions or removals.
- No application launch test yet.

## Completion condition

This part is complete only after:

1. `npm run check:environment` passes.
2. `npm install` completes without `npm ERR!`.
3. A locally generated `package-lock.json` exists.
4. The generated lockfile contains no `applied-caas-gateway` or `internal.api.openai.org` URL.

The resulting local lockfile must remain in the project. It will be included in later user-side checkpoints, but it is intentionally not shipped in this patch.
