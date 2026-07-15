import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "../../components";
import { AppIcon } from "../../design-system";
import {
  ImportSourceDialog,
  PasteGeneratedJsonDialog,
  SingleEntryFileImportDialog,
  VocabularyPackImportDialog,
  type SingleEntryFileImportPayload
} from "../../modules/import-export";
import { APP_COMMAND_EVENT, type AppCommandEventDetail } from "../command-bar";
import { getRouteByPath } from "../router";

interface AppTopBarProps {
  readonly onOpenCommandBar: () => void;
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
        <span className="app-topbar__route">{route.title}</span>
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
        open={sourceDialogOpen}
      />

      <SingleEntryFileImportDialog
        onClose={() => {
          setSingleEntryDialogOpen(false);
        }}
        onContinue={(payload) => {
          setSingleEntryDialogOpen(false);
          setImportPayload(payload);
        }}
        open={singleEntryDialogOpen}
      />

      <VocabularyPackImportDialog
        onClose={() => {
          setPackDialogOpen(false);
        }}
        onOpenLibrary={() => {
          setPackDialogOpen(false);
          navigate("/library");
        }}
        open={packDialogOpen}
      />

      {importPayload === undefined ? null : (
        <PasteGeneratedJsonDialog
          expectedWord={importPayload.expectedWord}
          initialInput={importPayload.input}
          key={`${importPayload.fileName}:${importPayload.expectedWord}`}
          onClose={() => {
            setImportPayload(undefined);
          }}
          onOpenSavedEntry={(word) => {
            setImportPayload(undefined);
            navigate(`/vocabulary?word=${encodeURIComponent(word)}`);
          }}
          open
          sourceFileName={importPayload.fileName}
        />
      )}
    </>
  );
}
