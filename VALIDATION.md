# Skeleton Validation

- JSON configuration files parsed successfully: 26
- Required final-product landmarks found: 20
- Primary screens represented: Vocabulary, Library, Settings
- API-provider and local-model modules intentionally absent
- `node_modules`, build output, binaries, credentials, and generated artifacts are excluded

Run on the target development machine:

```bash
npm install
npm run check:structure
npm run check:forbidden
npm run quality
npm run desktop
```

A lockfile is intentionally not included. Create and commit it after the first successful dependency installation.
