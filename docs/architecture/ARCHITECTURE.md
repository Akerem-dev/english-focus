# Architecture

UI -> application use cases -> domain ports <- infrastructure adapters.

Imported content:
clipboard/file -> raw text -> cleaner -> JSON parse -> version detection -> schema migration -> schema validation -> semantic validation -> quality warnings -> preview -> persistence transaction.

Search:
query -> normalizer -> exact lookup -> alias/inflection lookup -> prefix/FTS lookup -> fuzzy suggestion.
