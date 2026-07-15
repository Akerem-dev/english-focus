# Schema Validation and Correction Foundation

CP10 is the structural gate between JSON syntax parsing and later semantic review.

## Pipeline position

```text
Pasted text
→ local cleanup
→ JSON parse
→ strict Zod vocabulary schema validation   [CP10]
→ semantic validation                       [CP11]
→ quality inspection                        [CP11]
→ preview and explicit approval              [CP12]
→ duplicate decision and persistence         [later]
```

## Safety properties

- Validation is fully local.
- Unknown properties are rejected by strict schemas.
- Exactly ten primary examples are required.
- Failed validation never mutates Library.
- Passing structure does not claim semantic correctness.
- Correction instructions contain no provider, model, API key, or endpoint selection.
- Original JSON and validation errors are copied only when the user explicitly requests it.
