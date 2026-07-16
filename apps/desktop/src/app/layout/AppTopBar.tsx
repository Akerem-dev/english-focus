import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "../../components";
import { AppIcon } from "../../design-system";
import type { SingleEntryFileImportPayload } from "../../modules/import-export/overlays/SingleEntryFileImportDialog";
import { APP_COMMAND_EVENT, type AppCommandEventDetail } from "../command-bar";
import { getRouteByPath, ROUTE_PATHS } from "../router";

const ImportSourceDialog = lazy(async () => {
  const module = await import("../../modules/import-export/overlays/ImportSourceDialog");
  return { default: module.ImportSourceDialog };
});

const SingleEntryFileImportDialog = lazy(async () => {
  const module = await import("../../modules/import-export/overlays/SingleEntryFileImportDialog");
  return { default: module.SingleEntryFileImportDialog };
});

const VocabularyPackImportDialog = lazy(async () => {
  const module = await import("../../modules/import-export/overlays/VocabularyPackImportDialog");
  return { default: module.VocabularyPackImportDialog };
});

const PasteGeneratedJsonDialog = lazy(async () => {
  const module = await import("../../modules/import-export/overlays/PasteGeneratedJsonDialog");
  return { default: module.PasteGeneratedJsonDialog };
});

interface AppTopBarProps {
  readonly onOpenCommandBar: () => void;
}

function OverlayLoadingStatus() {
  return (
    <div aria-live="polite" className="visually-hidden" role="status">
      Preparing local import tools
    </div>
  );
}

export function AppTopBar({ onOpenCommandBar }: AppTopBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const route = getRouteByPath(location.pathname);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [singleEntryDialogOpen, setSingleEntryDialogOpen] = useState(false);
  const [packDialogOpen, setPackDialogOpen] = useState(false);
  const [importPayload, setImportPayload] = useState<SingleEntryFileImportPayload | undefined>();

  useEffect(() => {
    function handleAppCommand(event: Event) {
      const detail = (event as CustomEvent<AppCommandEventDetail>).detail;

      if (detail.action === "open-import") {
        setSourceDialogOpen(true);
      }
    }

    window.addEventListener(APP_COMMAND_EVENT, handleAppCommand);

    return () => {
      window.removeEventListener(APP_COMMAND_EVENT, handleAppCommand);
    };
  }, []);

  return (
    <>
      <header className="app-topbar">
        <span aria-live="polite" className="app-topbar__route">
          {route.title}
        </span>
        <div className="app-topbar__actions">
          <Button
            leadingIcon={<AppIcon name="upload" size={17} />}
            onClick={() => {
              setSourceDialogOpen(true);
            }}
            size="small"
            title="Import one entry or a vocabulary pack"
            variant="secondary"
          >
            Import
          </Button>
          <button
            aria-label="Open command bar"
            className="app-topbar__keycap"
            onClick={onOpenCommandBar}
            title="Open command bar (Ctrl+K)"
            type="button"
          >
            Ctrl+K
          </button>
        </div>
      </header>

      {sourceDialogOpen ? (
        <Suspense fallback={<OverlayLoadingStatus />}>
          <ImportSourceDialog
            onClose={() => {
              setSourceDialogOpen(false);
            }}
            onSelectPack={() => {
              setSourceDialogOpen(false);
              setPackDialogOpen(true);
            }}
            onSelectSingleEntry={() => {
              setSourceDialogOpen(false);
              setSingleEntryDialogOpen(true);
            }}
            open
          />
        </Suspense>
      ) : null}

      {singleEntryDialogOpen ? (
        <Suspense fallback={<OverlayLoadingStatus />}>
          <SingleEntryFileImportDialog
            onClose={() => {
              setSingleEntryDialogOpen(false);
            }}
            onContinue={(payload) => {
              setSingleEntryDialogOpen(false);
              setImportPayload(payload);
            }}
            open
          />
        </Suspense>
      ) : null}

      {packDialogOpen ? (
        <Suspense fallback={<OverlayLoadingStatus />}>
          <VocabularyPackImportDialog
            onClose={() => {
              setPackDialogOpen(false);
            }}
            onOpenLibrary={() => {
              setPackDialogOpen(false);
              navigate(ROUTE_PATHS.library);
            }}
            open
          />
        </Suspense>
      ) : null}

      {importPayload === undefined ? null : (
        <Suspense fallback={<OverlayLoadingStatus />}>
          <PasteGeneratedJsonDialog
            expectedWord={importPayload.expectedWord}
            initialInput={importPayload.input}
            key={`${importPayload.fileName}:${importPayload.expectedWord}`}
            onClose={() => {
              setImportPayload(undefined);
            }}
            onOpenSavedEntry={(word) => {
              setImportPayload(undefined);
              navigate(`${ROUTE_PATHS.vocabulary}?word=${encodeURIComponent(word)}`);
            }}
            open
            sourceFileName={importPayload.fileName}
          />
        </Suspense>
      )}
    </>
  );
}
