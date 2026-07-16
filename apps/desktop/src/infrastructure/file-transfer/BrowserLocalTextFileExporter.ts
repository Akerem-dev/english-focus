import type { LocalTextFileExporter } from "@platform/domain";

export class BrowserLocalTextFileExporter implements LocalTextFileExporter {
  async saveText(fileName: string, text: string, mediaType: string): Promise<void> {
    const blob = new Blob([text], { type: mediaType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.append(link);

    try {
      link.click();
    } finally {
      link.remove();
      URL.revokeObjectURL(url);
    }
  }
}
