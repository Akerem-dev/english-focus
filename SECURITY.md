# Security Policy

## Supported version

Security fixes are applied to the current `1.0.x` release line and the latest `main` branch.

## Reporting a vulnerability

Please do not publish exploit details, private user data, or proof-of-concept payloads in a public issue.

Use GitHub's private vulnerability reporting option from the repository **Security** tab when it is available. If the private report button is unavailable, open a minimal public issue requesting a private contact channel without including technical details.

A useful report includes:

- affected version and operating system
- the feature or data flow involved
- clear reproduction steps
- expected and observed behavior
- realistic impact
- a minimal proof of concept that does not expose real user data

## Security model

English Focus is a local-first desktop application.

- Vocabulary content, study metadata, settings, activity records, and backups remain on the device unless the user explicitly exports or copies them.
- The application has no cloud account, telemetry provider, embedded AI provider, or stored API key.
- Imported JSON is untrusted, size-limited, versioned, migrated, schema-validated, semantically checked, previewed, and written through guarded persistence flows.
- Imported HTML is not rendered, and user text must not be inserted through unsafe HTML APIs.
- Backups are validated before restore and written through transaction-aware native code.
- Logs avoid vocabulary content and other user-controlled data where practical.
- Tauri permissions remain minimal and feature-specific.
- The desktop shell applies a restrictive Content Security Policy and disables camera, microphone, and geolocation access.
- Windows release installers must be produced from clean current sources; stale installer and executable outputs are removed before packaging.

## Dependency security

JavaScript, Rust, and GitHub Actions dependencies are monitored through lockfiles and Dependabot configuration. Dependency updates must pass the repository quality checks before merging.

## Out of scope

The following are not security vulnerabilities by themselves:

- warnings caused only by an unsigned local rehearsal installer
- access to files the user explicitly selected for import, export, backup, or restore
- denial of service that requires manually importing a deliberately oversized file already rejected by documented limits
- issues that require a locally compromised operating system or modified application binary
