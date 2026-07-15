import { useVocabularyRepository } from "../../../app/providers";
import { Button, EmptyState, StatusBadge } from "../../../components";
import { AppIcon } from "../../../design-system";

function primaryTranslation(translations: readonly string[]): string {
  return translations.slice(0, 3).join(", ");
}

export function LibraryPage() {
  const { error, status, storedEntries } = useVocabularyRepository();

  return (
    <div className="route-page route-page--library">
      <header className="route-page__header">
        <div>
          <p className="route-page__eyebrow">Local collection</p>
          <h1>Library</h1>
          <p>Search, organize, review, and export vocabulary entries stored on this device.</p>
        </div>
        <span className="route-page__count">
          {storedEntries.length} {storedEntries.length === 1 ? "entry" : "entries"}
        </span>
      </header>

      {status === "error" ? (
        <section className="library-persistence-error" role="alert">
          <strong>Local vocabulary could not be loaded.</strong>
          <p>{error}</p>
        </section>
      ) : null}

      {storedEntries.length === 0 ? (
        <EmptyState
          actions={
            <>
              <Button disabled variant="primary">
                Search a word
              </Button>
              <Button disabled variant="secondary">
                Import JSON
              </Button>
            </>
          }
          className="library-empty-state"
          description={
            status === "loading"
              ? "Loading vocabulary saved on this device."
              : "Search for a word or import a structured vocabulary JSON entry to begin building your local collection."
          }
          icon={<AppIcon name="books" size={38} />}
          title={status === "loading" ? "Loading your library" : "Your library is empty"}
        />
      ) : (
        <section className="library-persistence-foundation" aria-labelledby="stored-entries-title">
          <header>
            <div>
              <p className="route-page__eyebrow">SQLite persistence</p>
              <h2 id="stored-entries-title">Saved vocabulary</h2>
            </div>
            <StatusBadge tone="success">Survives restart</StatusBadge>
          </header>
          <p className="library-persistence-foundation__note">
            CP14 confirms durable local storage. Search, filters, notes, favorites, and bulk actions
            arrive in the dedicated Library checkpoint.
          </p>
          <div className="library-persistence-list">
            {storedEntries.map(({ entry, layer }) => (
              <article className="library-persistence-row" key={entry.normalizedWord}>
                <div>
                  <h3>{entry.word}</h3>
                  <p>
                    {primaryTranslation(
                      entry.meanings.flatMap((meaning) => meaning.translationsTr)
                    )}
                  </p>
                </div>
                <div className="library-persistence-row__metadata">
                  <StatusBadge tone="accent">{entry.cefr}</StatusBadge>
                  <StatusBadge>{layer === "override" ? "User override" : "User entry"}</StatusBadge>
                  <StatusBadge tone="success">Reviewed</StatusBadge>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
