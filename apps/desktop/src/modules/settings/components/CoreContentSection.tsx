import { coreVocabularyEntries, coreVocabularyManifest } from "../../../content";

export function CoreContentSection() {
  return (
    <div className="core-content-status" data-testid="core-content-status">
      <div className="settings-value-row">
        <span>Bundled entries</span>
        <strong>{coreVocabularyEntries.length.toLocaleString("en-US")}</strong>
      </div>
      <div className="settings-value-row">
        <span>Content version</span>
        <strong>{coreVocabularyManifest.contentVersion}</strong>
      </div>
      <div className="settings-value-row">
        <span>Vocabulary schema</span>
        <strong>{coreVocabularyManifest.schemaVersion}</strong>
      </div>
      <div className="settings-value-row">
        <span>Storage</span>
        <strong>Read-only · local</strong>
      </div>
      <p className="settings-supporting-copy">
        Bundled content remains versioned and read-only. Personal notes, favorites, and overrides
        stay separate in local SQLite storage.
      </p>
    </div>
  );
}
