import type { InflectedForm } from "./InflectedForm";

export interface Morphology {
  baseForm: string;
  root?: string | undefined;
  prefix?: string | undefined;
  suffix?: string | undefined;
  inflectedForms: readonly InflectedForm[];
  notesEn?: string | undefined;
  notesTr?: string | undefined;
}
