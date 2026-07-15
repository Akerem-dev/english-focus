import { describe, expect, it } from "vitest";

import {
  repairMojibakeJsonValue,
  repairMojibakeText
} from "../../../src/modules/import-export/services";

describe("mojibake repair", () => {
  it("repairs common Turkish UTF-8 text decoded as Windows-1252", () => {
    expect(repairMojibakeText("tahsis etmek, ayÄ±rmak")).toMatchObject({
      value: "tahsis etmek, ayırmak",
      changed: true
    });

    expect(repairMojibakeText("hedef kiÅŸi veya amaÃ§")).toMatchObject({
      value: "hedef kişi veya amaç",
      changed: true
    });
  });

  it("leaves already-correct Turkish text unchanged", () => {
    expect(repairMojibakeText("ayırmak, kişi, amaç, geçişli")).toEqual({
      value: "ayırmak, kişi, amaç, geçişli",
      changed: false,
      repairedStringCount: 0
    });
  });

  it("repairs nested JSON string values without changing keys or numbers", () => {
    const result = repairMojibakeJsonValue({
      word: "allocate",
      translationsTr: ["tahsis etmek", "ayÄ±rmak"],
      grammar: {
        summaryTr: "hedef kiÅŸi veya amaÃ§",
        count: 10
      }
    });

    expect(result.changed).toBe(true);
    expect(result.repairedStringCount).toBe(2);
    expect(result.value).toEqual({
      word: "allocate",
      translationsTr: ["tahsis etmek", "ayırmak"],
      grammar: {
        summaryTr: "hedef kişi veya amaç",
        count: 10
      }
    });
  });
});
