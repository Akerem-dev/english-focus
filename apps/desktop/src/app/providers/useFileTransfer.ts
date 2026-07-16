import { useContext } from "react";

import type { FileTransferContextValue } from "./FileTransferContext";
import { FileTransferContext } from "./FileTransferContext";

const MISSING_FILE_TRANSFER: FileTransferContextValue = Object.freeze({
  exporter: Object.freeze({
    async saveText(): Promise<void> {
      throw new Error("FileTransferProvider is not mounted.");
    }
  }),
  reader: Object.freeze({
    async readText() {
      return {
        kind: "failure" as const,
        code: "invalid-source" as const,
        fileName: "Unknown file"
      };
    }
  })
});

export function useFileTransfer(): FileTransferContextValue {
  return useContext(FileTransferContext) ?? MISSING_FILE_TRANSFER;
}
