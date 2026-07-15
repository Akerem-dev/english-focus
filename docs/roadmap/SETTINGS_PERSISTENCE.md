# Settings Persistence

CP19 owns the persistent application-settings boundary.

Settings are represented by a versioned `AppSettings` object, validated with Zod in TypeScript, stored as JSON in a singleton SQLite row, and applied through a React provider.

The system theme is resolved from the operating-system color preference. Explicit light and dark choices override it. Reduced motion and interface size are expressed as document data attributes so the complete interface follows the same setting contract.
