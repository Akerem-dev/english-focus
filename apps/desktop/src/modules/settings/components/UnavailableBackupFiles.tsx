import { useState } from "react";
import type { UnavailableBackup } from "@platform/domain";

import { Button } from "../../../components";

interface UnavailableBackupFilesProps {
  readonly busy: boolean;
  readonly files: readonly UnavailableBackup[];
  readonly onRemove: (fileName: string) => Promise<void>;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UnavailableBackupFiles({ busy, files, onRemove }: UnavailableBackupFilesProps) {
  const [reviewingFileName, setReviewingFileName] = useState<string | undefined>();

  if (files.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="unavailable-backups-heading" className="backup-unavailable">
      <header className="backup-unavailable__header">
        <div>
          <h3 id="unavailable-backups-heading">Files that need attention</h3>
          <p>These files cannot be restored, but you can remove them safely.</p>
        </div>
        <strong>{files.length}</strong>
      </header>

      <div className="backup-unavailable__list">
        {files.map((file) => {
          const reviewing = reviewingFileName === file.fileName;

          return (
            <div className="backup-unavailable__item" key={file.fileName}>
              <div>
                <strong>{file.fileName}</strong>
                <p>
                  {file.issue} · {formatSize(file.sizeBytes)}
                </p>
              </div>

              {reviewing ? (
                <div className="backup-unavailable__actions">
                  <Button
                    disabled={busy}
                    onClick={() => {
                      setReviewingFileName(undefined);
                    }}
                    size="small"
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={busy}
                    onClick={() => {
                      void onRemove(file.fileName)
                        .then(() => {
                          setReviewingFileName(undefined);
                        })
                        .catch(() => undefined);
                    }}
                    size="small"
                    variant="danger"
                  >
                    Remove file
                  </Button>
                </div>
              ) : (
                <Button
                  disabled={busy}
                  onClick={() => {
                    setReviewingFileName(file.fileName);
                  }}
                  size="small"
                  variant="ghost"
                >
                  Remove
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
