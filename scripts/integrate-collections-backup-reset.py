from pathlib import Path
import json
import re


def read(path: str) -> str:
    return Path(path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    Path(path).write_text(text, encoding="utf-8")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)


def sub_once(text: str, pattern: str, replacement: str, label: str, flags: int = 0) -> str:
    text, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count != 1:
        raise RuntimeError(f"{label}: expected 1 regex match, found {count}")
    return text


# -----------------------------------------------------------------------------
# Collections validator: backup/restore must validate the same state shape.
# -----------------------------------------------------------------------------
path = "apps/desktop/src-tauri/src/commands/collections.rs"
text = read(path)
text = replace_once(
    text,
    "fn validate_collections_state(value: &Value) -> Result<(), String> {",
    "pub(crate) fn validate_collections_state(value: &Value) -> Result<(), String> {",
    "collections validator visibility",
)
write(path, text)


# -----------------------------------------------------------------------------
# Native backup/restore: schema 4 includes collections; schema 2/3 stay readable.
# -----------------------------------------------------------------------------
path = "apps/desktop/src-tauri/src/commands/backup.rs"
text = read(path)
text = replace_once(
    text,
    "use crate::{\n    state::AppState,",
    "use crate::{\n    commands::collections::validate_collections_state,\n    state::AppState,",
    "backup collections validator import",
)
text = replace_once(
    text,
    'const DATABASE_SCHEMA_VERSION: &str = "3";',
    'const DATABASE_SCHEMA_VERSION: &str = "4";',
    "backup schema version",
)
text = replace_once(
    text,
    "struct BackupData {\n    entries: Vec<BackupVocabularyEntry>,\n    metadata: Vec<BackupVocabularyMetadata>,\n    settings: Option<Value>,\n}",
    "struct BackupData {\n    entries: Vec<BackupVocabularyEntry>,\n    metadata: Vec<BackupVocabularyMetadata>,\n    settings: Option<Value>,\n    #[serde(default, skip_serializing_if = \"Option::is_none\")]\n    collections_state: Option<Value>,\n}",
    "backup data collections",
)
text = replace_once(
    text,
    '        "Stored application settings cannot be backed up safely:",\n',
    '        "Stored application settings cannot be backed up safely:",\n        "Stored collections JSON is invalid:",\n        "Stored collections cannot be backed up safely:",\n',
    "backup corruption prefixes",
)

build_marker = "fn build_manifest(\n"
if text.count(build_marker) != 1:
    raise RuntimeError("backup build_manifest marker mismatch")
read_collections = '''fn read_collections_state(connection: &Connection) -> Result<Option<Value>, String> {
    let state_json = connection
        .query_row(
            "SELECT state_json FROM collections_state WHERE id = 1",
            [],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .map_err(|error| format!("Collections could not be read for backup: {error}"))?;

    state_json
        .map(|json| {
            let collections_state: Value = serde_json::from_str(&json)
                .map_err(|error| format!("Stored collections JSON is invalid: {error}"))?;
            validate_collections_state(&collections_state).map_err(|error| {
                format!("Stored collections cannot be backed up safely: {error}")
            })?;
            Ok(collections_state)
        })
        .transpose()
}

'''
text = text.replace(build_marker, read_collections + build_marker, 1)
text = replace_once(
    text,
    "        settings: read_settings(connection)?,\n    };",
    "        settings: read_settings(connection)?,\n        collections_state: read_collections_state(connection)?,\n    };",
    "backup build data",
)
text = replace_once(
    text,
    '    if manifest.database_schema_version != "2"\n        && manifest.database_schema_version != DATABASE_SCHEMA_VERSION\n    {',
    '    if manifest.database_schema_version != "2"\n        && manifest.database_schema_version != "3"\n        && manifest.database_schema_version != DATABASE_SCHEMA_VERSION\n    {',
    "backup legacy schema support",
)
text = replace_once(
    text,
    "    if let Some(settings) = &manifest.data.settings {\n        if let Err(error) = validate_app_settings(settings) {\n            issues.push(format!(\n                \"The backup application settings are invalid: {error}\"\n            ));\n        }\n    }\n\n    issues",
    "    if let Some(settings) = &manifest.data.settings {\n        if let Err(error) = validate_app_settings(settings) {\n            issues.push(format!(\n                \"The backup application settings are invalid: {error}\"\n            ));\n        }\n    }\n\n    if let Some(collections_state) = &manifest.data.collections_state {\n        if let Err(error) = validate_collections_state(collections_state) {\n            issues.push(format!(\"The backup collections are invalid: {error}\"));\n        }\n    }\n\n    issues",
    "backup collections validation",
)

# Insert collection clearing after the existing app_settings deletion. Regex avoids
# whitespace/line-ending fragility.
text = sub_once(
    text,
    r'(\s*transaction\s*\n\s*\.execute\("DELETE FROM app_settings", \[\]\)\s*\n\s*\.map_err\(\|error\| format!\("Existing settings could not be cleared: \{error\}"\)\)\?;)',
    r'''\1

    let restores_collections = manifest.database_schema_version == DATABASE_SCHEMA_VERSION;
    if restores_collections {
        transaction
            .execute("DELETE FROM collections_state", [])
            .map_err(|error| format!("Existing collections could not be cleared: {error}"))?;
    }''',
    "restore clear collections",
)

# Restore collection state immediately before commit. Old schema 2/3 backups do
# not touch collections at all.
text = sub_once(
    text,
    r'(\n\s{4}transaction\s*\n\s{8}\.commit\(\))',
    '''

    if restores_collections {
        if let Some(collections_state) = &manifest.data.collections_state {
            let state_json = serde_json::to_string(collections_state)
                .map_err(|error| format!("Restored collections are invalid: {error}"))?;
            transaction
                .execute(
                    "INSERT INTO collections_state(id, state_json, updated_at) VALUES (1, ?1, ?2)",
                    params![state_json, &restored_at],
                )
                .map_err(|error| format!("Collections could not be restored: {error}"))?;
        }
    }\1''',
    "restore collections state",
)

# Native backup tests use an in-memory schema, so collections_state must exist.
text = sub_once(
    text,
    r'(CREATE TABLE app_settings \(\s*\n\s*id INTEGER PRIMARY KEY,\s*\n\s*settings_json TEXT NOT NULL,\s*\n\s*updated_at TEXT NOT NULL\s*\n\s*\);)',
    r'''\1
                CREATE TABLE collections_state (
                    id INTEGER PRIMARY KEY,
                    state_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );''',
    "backup test collections table",
)
# Every BackupData literal in this file currently has settings as its final field.
text = re.sub(
    r'(\n\s+settings: (?:None|Some\([^\n]+\)),)(\n\s+\};)',
    r'\1\n            collections_state: None,\2',
    text,
)
write(path, text)


# -----------------------------------------------------------------------------
# Native local-data reset: Collections becomes a first-class removable category.
# -----------------------------------------------------------------------------
path = "apps/desktop/src-tauri/src/commands/data_reset.rs"
text = read(path)
text = replace_once(
    text,
    "use serde::{Deserialize, Serialize};",
    "use rusqlite::OptionalExtension;\nuse serde::{Deserialize, Serialize};",
    "reset optional extension import",
)
text = replace_once(
    text,
    'const ALLOWED_CATEGORIES: [&str; 6] = [\n    "study-metadata",\n    "user-vocabulary",\n    "overrides",\n    "settings",\n    "activity",\n    "backups",\n];',
    'const ALLOWED_CATEGORIES: [&str; 7] = [\n    "study-metadata",\n    "user-vocabulary",\n    "overrides",\n    "collections",\n    "settings",\n    "activity",\n    "backups",\n];',
    "reset categories collections",
)
text = replace_once(
    text,
    "    override_vocabulary_entries: usize,\n    settings_records: usize,",
    "    override_vocabulary_entries: usize,\n    collections_records: usize,\n    settings_records: usize,",
    "reset snapshot collections field",
)

snapshot_marker = "fn snapshot_from_connection(\n"
if text.count(snapshot_marker) != 1:
    raise RuntimeError("reset snapshot marker mismatch")
collections_count_helper = '''fn collections_count(connection: &rusqlite::Connection) -> Result<usize, String> {
    let state_json = connection
        .query_row(
            "SELECT state_json FROM collections_state WHERE id = 1",
            [],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .map_err(|error| format!("Collection totals could not be read: {error}"))?;

    let Some(state_json) = state_json else {
        return Ok(0);
    };
    let state: serde_json::Value = serde_json::from_str(&state_json)
        .map_err(|error| format!("Stored collections JSON is invalid: {error}"))?;
    Ok(state
        .get("collections")
        .and_then(serde_json::Value::as_array)
        .map_or(0, Vec::len))
}

'''
text = text.replace(snapshot_marker, collections_count_helper + snapshot_marker, 1)
text = replace_once(
    text,
    "        override_vocabulary_entries: count_query(\n            connection,\n            \"SELECT COUNT(*) FROM vocabulary_entries WHERE layer = 'override'\",\n        )?,\n        settings_records:",
    "        override_vocabulary_entries: count_query(\n            connection,\n            \"SELECT COUNT(*) FROM vocabulary_entries WHERE layer = 'override'\",\n        )?,\n        collections_records: collections_count(connection)?,\n        settings_records:",
    "reset snapshot collections count",
)
text = replace_once(
    text,
    '            "study-metadata" | "user-vocabulary" | "overrides" | "settings"',
    '            "study-metadata" | "user-vocabulary" | "overrides" | "collections" | "settings"',
    "reset safety backup collections",
)
activity_marker = '    if categories.contains("activity") {\n'
if text.count(activity_marker) != 1:
    raise RuntimeError("reset activity marker mismatch")
collection_reset = '''    if categories.contains("collections") {
        deleted.collections_records = collections_count(&transaction)?;
        transaction
            .execute("DELETE FROM collections_state", [])
            .map_err(|error| format!("Collections could not be removed: {error}"))?;
    }

'''
text = text.replace(activity_marker, collection_reset + activity_marker, 1)
write(path, text)


# -----------------------------------------------------------------------------
# TypeScript domain and runtime schemas.
# -----------------------------------------------------------------------------
path = "packages/domain/src/backup/BackupDescriptor.ts"
text = read(path)
text = replace_once(
    text,
    '  readonly databaseSchemaVersion: "2" | "3";',
    '  readonly databaseSchemaVersion: "2" | "3" | "4";',
    "domain backup schema version",
)
write(path, text)

path = "packages/schemas/src/backup/backup-manifest.schema.ts"
text = read(path)
text = replace_once(
    text,
    'databaseSchemaVersion: z.enum(["2", "3"])',
    'databaseSchemaVersion: z.enum(["2", "3", "4"])',
    "zod backup schema version",
)
write(path, text)

path = "packages/domain/src/data/LocalDataReset.ts"
text = read(path)
text = replace_once(
    text,
    '  "overrides",\n  "settings",',
    '  "overrides",\n  "collections",\n  "settings",',
    "domain reset category",
)
text = replace_once(
    text,
    "  readonly overrideVocabularyEntries: number;\n  readonly settingsRecords: number;",
    "  readonly overrideVocabularyEntries: number;\n  readonly collectionsRecords: number;\n  readonly settingsRecords: number;",
    "domain reset snapshot",
)
write(path, text)

path = "packages/schemas/src/data/local-data.schema.ts"
text = read(path)
text = replace_once(
    text,
    '  "overrides",\n  "settings",',
    '  "overrides",\n  "collections",\n  "settings",',
    "zod reset category",
)
text = replace_once(
    text,
    "    overrideVocabularyEntries: z.number().int().nonnegative(),\n    settingsRecords:",
    "    overrideVocabularyEntries: z.number().int().nonnegative(),\n    collectionsRecords: z.number().int().nonnegative(),\n    settingsRecords:",
    "zod reset snapshot",
)
write(path, text)


# -----------------------------------------------------------------------------
# Frontend local-data management.
# -----------------------------------------------------------------------------
path = "apps/desktop/src/modules/settings/application/ManageLocalData.ts"
text = read(path)
text = replace_once(
    text,
    '  "overrides",\n  "settings",',
    '  "overrides",\n  "collections",\n  "settings",',
    "full reset collections",
)
text = replace_once(
    text,
    '["study-metadata", "user-vocabulary", "overrides", "settings"].includes(category)',
    '["study-metadata", "user-vocabulary", "overrides", "collections", "settings"].includes(\n        category\n      )',
    "safety backup collections ui",
)
text = replace_once(
    text,
    '      case "settings":\n        return total + snapshot.settingsRecords;',
    '      case "collections":\n        return total + snapshot.collectionsRecords;\n      case "settings":\n        return total + snapshot.settingsRecords;',
    "selected collections count",
)
text = replace_once(
    text,
    "    deleted.overrideVocabularyEntries +\n    deleted.settingsRecords +",
    "    deleted.overrideVocabularyEntries +\n    deleted.collectionsRecords +\n    deleted.settingsRecords +",
    "deleted collections count",
)
write(path, text)

path = "apps/desktop/src/infrastructure/persistence/TauriLocalDataRepository.ts"
text = read(path)
text = replace_once(
    text,
    "  overrideVocabularyEntries: 0,\n  settingsRecords: 0,",
    "  overrideVocabularyEntries: 0,\n  collectionsRecords: 0,\n  settingsRecords: 0,",
    "local repository collections default",
)
write(path, text)

path = "apps/desktop/src/modules/settings/components/LocalDataControlsSection.tsx"
text = read(path)
text = replace_once(
    text,
    "  overrideVocabularyEntries: 0,\n  settingsRecords: 0,",
    "  overrideVocabularyEntries: 0,\n  collectionsRecords: 0,\n  settingsRecords: 0,",
    "settings collections default",
)
collection_option_anchor = '''    {
      category: "overrides",
      title: "Built-in words I edited",
      description: "Your edits are removed and the original built-in versions return.",
      count: snapshot.overrideVocabularyEntries
    },
'''
if text.count(collection_option_anchor) != 1:
    raise RuntimeError("settings overrides category marker mismatch")
text = text.replace(
    collection_option_anchor,
    collection_option_anchor
    + '''    {
      category: "collections",
      title: "Collections",
      description: "Your saved collection groups, covers, and the words organized inside them.",
      count: snapshot.collectionsRecords
    },
''',
    1,
)
text = replace_once(
    text,
    "            Remove added words, edits, personal details, settings, and activity. Built-in words and\n            saved backups stay available.",
    "            Remove added words, edits, personal details, collections, settings, and activity. Built-in\n            words and saved backups stay available.",
    "full reset description collections",
)
write(path, text)


# -----------------------------------------------------------------------------
# Focused fixtures/tests. Generated native JSON schemas are handled separately.
# -----------------------------------------------------------------------------
path = "packages/schemas/tests/local-data.schema.test.ts"
text = read(path)
text = replace_once(
    text,
    "  overrideVocabularyEntries: 0,\n  settingsRecords: 0,",
    "  overrideVocabularyEntries: 0,\n  collectionsRecords: 0,\n  settingsRecords: 0,",
    "local data schema test fixture",
)
write(path, text)

path = "apps/desktop/tests/unit/settings/local-data-management.test.ts"
text = read(path)
text = replace_once(
    text,
    "  overrideVocabularyEntries: 2,\n  settingsRecords: 1,",
    "  overrideVocabularyEntries: 2,\n  collectionsRecords: 6,\n  settingsRecords: 1,",
    "local data management snapshot fixture",
)
text = replace_once(
    text,
    "    overrideVocabularyEntries: 0,\n    settingsRecords: 1,",
    "    overrideVocabularyEntries: 0,\n    collectionsRecords: 0,\n    settingsRecords: 1,",
    "local data management result fixture",
)
text = replace_once(
    text,
    '      "overrides",\n      "settings",',
    '      "overrides",\n      "collections",\n      "settings",',
    "full reset expectation collections",
)
# Add an explicit safety-backup assertion for the new data category.
text = replace_once(
    text,
    '    expect(canCreateSafetyBackup(["settings", "study-metadata"])).toBe(true);',
    '    expect(canCreateSafetyBackup(["settings", "study-metadata"])).toBe(true);\n    expect(canCreateSafetyBackup(["collections"])).toBe(true);',
    "collections safety backup test",
)
write(path, text)

# Native boundary fixtures serialize local-data snapshots. Add the new field to
# matching objects without touching unrelated fixture shapes.
path = "testing/contracts/native-boundary-fixtures.json"
data = json.loads(read(path))


def add_collection_snapshot_counts(node):
    if isinstance(node, dict):
        keys = set(node)
        if {
            "studyMetadataRecords",
            "userVocabularyEntries",
            "overrideVocabularyEntries",
            "settingsRecords",
            "activityRecords",
            "backupFiles",
        }.issubset(keys):
            node.setdefault("collectionsRecords", 0)
        for value in node.values():
            add_collection_snapshot_counts(value)
    elif isinstance(node, list):
        for value in node:
            add_collection_snapshot_counts(value)


add_collection_snapshot_counts(data)
write(path, json.dumps(data, indent=2) + "\n")

print("Collections backup/restore/reset integration patch applied.")
