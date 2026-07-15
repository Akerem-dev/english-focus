import type { AppearanceSettings } from "./AppearanceSettings";
import type { ContentSettings } from "./ContentSettings";
import type { DataSettings } from "./DataSettings";
import type { GeneralSettings } from "./GeneralSettings";
import type { InstructionSettings } from "./InstructionSettings";

export interface AppSettings {
  readonly schemaVersion: "1.0.0";
  readonly general: GeneralSettings;
  readonly content: ContentSettings;
  readonly data: DataSettings;
  readonly appearance: AppearanceSettings;
  readonly instruction: InstructionSettings;
  readonly updatedAt: string;
}
