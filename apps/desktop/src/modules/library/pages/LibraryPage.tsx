import { Button, EmptyState } from "../../../components";
import { AppIcon } from "../../../design-system";

export function LibraryPage() {
  return (
    <div className="route-page route-page--library">
      <header className="route-page__header">
        <div>
          <p className="route-page__eyebrow">Local collection</p>
          <h1>Library</h1>
          <p>Search, organize, review, and export vocabulary entries stored on this device.</p>
        </div>
        <span className="route-page__count">0 entries</span>
      </header>

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
        description="Search for a word or import a structured vocabulary JSON entry to begin building your local collection."
        icon={<AppIcon name="books" size={38} />}
        title="Your library is empty"
      />
    </div>
  );
}
