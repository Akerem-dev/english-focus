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

      <div className="settings-about__summary">
        <div className="settings-about__item">
          <AppIcon name="book-open" size={16} />
          <span>English Focus</span>
          <strong>{desktopPackage.version}</strong>
        </div>
        <div className="settings-about__item">
          <AppIcon name="books" size={16} />
          <span>Local SQLite storage</span>
        </div>
      </div>

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
