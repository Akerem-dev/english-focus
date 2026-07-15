# Semantic & Quality Validation Foundation

## Pipeline position

```text
Pasted text
→ local cleanup
→ JSON.parse
→ strict versioned Zod schema
→ semantic validation
→ quality inspection
→ preview (CP12)
→ duplicate decision
→ persistence
```

## Semantic validation

Semantic validation is blocking and deterministic. It checks internal consistency rather than attempting to prove that a linguistic claim is factually correct.

Blocking categories include:

- expected target word versus `normalizedWord`
- `word`, `normalizedWord`, morphology, aliases, and inflected-form consistency
- source and generation metadata expected for pasted external-AI content
- bilingual optional fields that must appear as English/Turkish pairs
- duplicate and self-referential word-family or related-word items
- grammar, collocation, phrasal-verb, idiom, and primary examples that omit the target or a declared form
- duplicate primary examples
- timestamp ordering
- ineffective common-mistake pairs

## Quality inspection

Quality issues are warnings. They never require invented content and never block preview when semantic validation passes.

Examples:

- one documented meaning
- absent reliable etymology
- empty word family, grammar patterns, collocations, related words, or common mistakes
- missing primary-example labels or context
- collocations without bilingual examples
- related words without bilingual distinction notes
- warnings already declared by the generator

## Trust boundary

The validator does not claim that definitions, translations, etymology, or examples are linguistically correct. Human review and later content-review status remain separate responsibilities.
