import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "../../components";
import { AppIcon } from "../../design-system";
import {
  PasteGeneratedJsonDialog,
  SingleEntryFileImportDialog,
  type SingleEntryFileImportPayload
} from "../../modules/import-export";
import { getRouteByPath } from "../router";

export function AppTopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const route = getRouteByPath(location.pathname);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [importPayload, setImportPayload] = useState<SingleEntryFileImportPayload | undefined>();

  return (
    <>
      <header className="app-topbar">
        <span className="app-topbar__route">{route.title}</span>
        <div className="app-topbar__actions">
          <Button
            leadingIcon={<AppIcon name="upload" size={17} />}
            onClick={() => {
              setFileDialogOpen(true);
            }}
            size="small"
            title="Import one vocabulary JSON file"
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

      <SingleEntryFileImportDialog
        onClose={() => {
          setFileDialogOpen(false);
        }}
        onContinue={(payload) => {
          setFileDialogOpen(false);
          setImportPayload(payload);
        }}
        open={fileDialogOpen}
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
