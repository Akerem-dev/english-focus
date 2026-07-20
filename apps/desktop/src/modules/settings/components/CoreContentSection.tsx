import desktopPackage from "../../../../package.json";

import { AppIcon } from "../../../design-system";
import { coreVocabularyEntries, coreVocabularyManifest } from "../../../content";

export function CoreContentSection() {
  return (
    <div className="settings-about" data-testid="core-content-status">
      <header className="settings-about__header">
        <span aria-hidden="true" className="settings-about__icon">
          <AppIcon name="book-open" size={17} />
        </span>
        <strong>About this app</strong>
      </header>

      <dl className="settings-about__summary" aria-label="App information">
        <div className="settings-about__item">
          <dt>Application</dt>
          <dd>English Focus</dd>
        </div>
        <div className="settings-about__item">
          <dt>Version</dt>
          <dd>{desktopPackage.version}</dd>
        </div>
        <div className="settings-about__item">
          <dt>Storage</dt>
          <dd>Local SQLite</dd>
        </div>
      </dl>

      <details className="settings-about__details">
        <summary>
          <span>View version details</span>
          <AppIcon name="chevron-down" size={15} />
        </summary>
        <div className="settings-about__technical">
          <div>
            <span>Bundled entries</span>
            <strong>{coreVocabularyEntries.length.toLocaleString("en-US")}</strong>
          </div>
          <div>
            <span>Content version</span>
            <strong>{coreVocabularyManifest.contentVersion}</strong>
          </div>
          <div>
            <span>Vocabulary schema</span>
            <strong>{coreVocabularyManifest.schemaVersion}</strong>
          </div>
          <div>
            <span>Storage</span>
            <strong>Read-only · local</strong>
          </div>
        </div>
      </details>
    </div>
  );
}
