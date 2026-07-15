import { useState } from "react";
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
import { getRouteByPath } from "../router";

export function AppTopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const route = getRouteByPath(location.pathname);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [singleEntryDialogOpen, setSingleEntryDialogOpen] = useState(false);
  const [packDialogOpen, setPackDialogOpen] = useState(false);
  const [importPayload, setImportPayload] = useState<SingleEntryFileImportPayload | undefined>();

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
            aria-label="Command bar arrives in a later checkpoint"
            className="app-topbar__keycap"
            disabled
            title="Command bar arrives in a later checkpoint"
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
