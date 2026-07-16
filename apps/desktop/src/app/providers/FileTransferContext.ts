import { createContext } from "react";

import type { LocalTextFileExporter, LocalTextFileReader } from "@platform/domain";

export interface FileTransferContextValue {
  readonly exporter: LocalTextFileExporter;
  readonly reader: LocalTextFileReader;
}

export const FileTransferContext = createContext<FileTransferContextValue | undefined>(undefined);
