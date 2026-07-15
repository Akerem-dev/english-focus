# External-AI Instruction Bridge

CP08 introduces the first user-visible bridge between English Focus and an external AI account without integrating any provider or API.

## Data flow

```text
valid missing word
→ deterministic local instruction
→ user reviews instruction
→ local clipboard copy
→ user pastes into an external AI account
```

No content is transmitted by English Focus.

## Instruction contract

The instruction always includes:

- normalized target word;
- vocabulary schema version;
- instruction-template version;
- current strict JSON Schema;
- exactly ten primary examples;
- Turkish explanation language;
- learner proficiency and detail preferences;
- applicable-grammar rule;
- no-invented-content rule;
- one-JSON-object-only output rule.

## Provider independence

The product contains no:

- provider selector;
- model selector;
- API key field;
- remote endpoint;
- background network request.

## Preference lifetime

CP08 preferences are shared across routes for the current application session. Persistent storage belongs to the later settings-repository checkpoint.

## Security and privacy

The generated instruction is plain text. Copying writes only to the device clipboard. The next JSON-ingestion checkpoint will treat pasted content as untrusted input and validate it before storage.
