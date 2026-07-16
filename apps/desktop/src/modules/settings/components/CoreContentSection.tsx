import { StatusBadge } from "../../../components";
import { coreVocabularyEntries, coreVocabularyManifest } from "../../../content";

export function CoreContentSection() {
  const sampleWords = coreVocabularyManifest.qualityPolicy.manualSampleWords.join(", ");

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
        <span>Validation state</span>
        <StatusBadge tone="success">Pilot validated</StatusBadge>
      </div>
      <div className="settings-value-row settings-value-row--stacked">
        <span>Manual review sample</span>
        <strong>{sampleWords}</strong>
      </div>
      <p className="settings-supporting-copy">
        Core content is read-only and versioned. Personal notes, favorites, learning status, and
        overrides remain separate in local SQLite storage.
      </p>
    </div>
  );
}
