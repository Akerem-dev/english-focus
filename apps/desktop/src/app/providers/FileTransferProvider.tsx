import { useMemo, type PropsWithChildren } from "react";

import type { LocalTextFileExporter, LocalTextFileReader } from "@platform/domain";

import {
  BrowserLocalTextFileExporter,
  BrowserLocalTextFileReader
} from "../../infrastructure/file-transfer";
import { FileTransferContext, type FileTransferContextValue } from "./FileTransferContext";

interface FileTransferProviderProps extends PropsWithChildren {
  readonly exporter?: LocalTextFileExporter;
  readonly reader?: LocalTextFileReader;
}

export function FileTransferProvider({ children, exporter, reader }: FileTransferProviderProps) {
  const value = useMemo<FileTransferContextValue>(
    () => ({
      exporter: exporter ?? new BrowserLocalTextFileExporter(),
      reader: reader ?? new BrowserLocalTextFileReader()
    }),
    [exporter, reader]
  );

  return <FileTransferContext.Provider value={value}>{children}</FileTransferContext.Provider>;
}
