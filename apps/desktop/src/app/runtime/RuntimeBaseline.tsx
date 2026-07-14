import { useEffect, useState } from "react";

import { AppIcon, EnglishFocusMark } from "../../design-system";
import {
  Button,
  Divider,
  IconButton,
  Inline,
  PageHeader,
  SearchInput,
  Section,
  SelectField,
  Stack,
  StatusBadge,
  SwitchField,
  TagChip,
  TextAreaField,
  TextField
} from "../../components";
import { connectToRuntime, type RuntimeConnection } from "./runtimeBridge";

type RuntimeState = { readonly kind: "checking" } | RuntimeConnection;

function getRuntimeStatus(state: RuntimeState) {
  switch (state.kind) {
    case "native":
      return {
        label: `${state.info.runtime} connected`,
        detail: `${state.info.productName} ${state.info.appVersion}`,
        tone: "success" as const
      };
    case "browser":
      return {
        label: "Browser preview",
        detail: "Run npm run desktop for the native checkpoint",
        tone: "warning" as const
      };
    case "error":
      return {
        label: "Runtime error",
        detail: state.message,
        tone: "danger" as const
      };
    case "checking":
      return {
        label: "Checking runtime",
        detail: "Confirming the Tauri connection…",
        tone: "neutral" as const
      };
  }
}

export function RuntimeBaseline() {
  const [runtimeState, setRuntimeState] = useState<RuntimeState>({ kind: "checking" });
  const [searchValue, setSearchValue] = useState("maintain");
  const [cefrLevel, setCefrLevel] = useState("B2");
  const [showGrammar, setShowGrammar] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    void connectToRuntime().then((connection) => {
      if (isCurrent) {
        setRuntimeState(connection);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  const runtimeStatus = getRuntimeStatus(runtimeState);

  return (
    <main className="component-foundation" aria-labelledby="component-foundation-title">
      <div className="component-foundation__brand-bar">
        <EnglishFocusMark className="component-foundation__monogram" label="English Focus mark" />
        <span className="component-foundation__brand-name">English Focus</span>
        <StatusBadge tone={runtimeStatus.tone}>{runtimeStatus.label}</StatusBadge>
      </div>

      <div className="component-foundation__body">
        <PageHeader
          description="The reusable controls now share one token system, keyboard focus language, disabled behavior, and accessible labeling contract."
          eyebrow="Checkpoint CP04B"
          title="Accessible component foundation ready"
          titleId="component-foundation-title"
          actions={
            <IconButton
              icon={<AppIcon name="settings" size={18} />}
              label="Component settings"
              variant="outlined"
            />
          }
        />

        <p className="component-foundation__runtime-detail" aria-live="polite">
          {runtimeStatus.detail}
        </p>

        <div className="component-foundation__grid">
          <Stack gap="large">
            <Section
              description="Primary actions, secondary actions, quiet actions, and icon-only controls."
              title="Actions"
            >
              <Inline gap="small">
                <Button leadingIcon={<AppIcon name="search" size={17} />} variant="primary">
                  Search word
                </Button>
                <Button variant="secondary">Import JSON</Button>
                <Button variant="ghost">Cancel</Button>
                <IconButton
                  icon={<AppIcon name="star" size={18} />}
                  label="Add to favorites"
                  variant="accent"
                />
              </Inline>
            </Section>

            <Section
              description="Every field owns a visible or screen-reader label and deterministic helper text."
              title="Form controls"
            >
              <Stack gap="medium">
                <SearchInput
                  helperText="Local exact match, forms, aliases, and suggestions."
                  label="Search vocabulary"
                  onChange={(event) => {
                    setSearchValue(event.currentTarget.value);
                  }}
                  onClear={() => {
                    setSearchValue("");
                  }}
                  placeholder="Type an English word"
                  value={searchValue}
                />
                <div className="component-foundation__form-grid">
                  <TextField
                    defaultValue="IELTS"
                    helperText="Used to group entries in Library."
                    label="Tag name"
                  />
                  <SelectField
                    label="CEFR level"
                    onChange={(event) => {
                      setCefrLevel(event.currentTarget.value);
                    }}
                    value={cefrLevel}
                  >
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                  </SelectField>
                </div>
                <TextAreaField
                  defaultValue="A practical note about how this word is used."
                  helperText="Stored locally with the vocabulary entry."
                  label="Personal note"
                  rows={3}
                />
                <SwitchField
                  checked={showGrammar}
                  description="Include applicable patterns without inventing invalid structures."
                  label="Show grammar notes"
                  onChange={(event) => {
                    setShowGrammar(event.currentTarget.checked);
                  }}
                />
              </Stack>
            </Section>
          </Stack>

          <Stack gap="large">
            <Section
              description="Compact semantic indicators remain readable without relying on color alone."
              title="Vocabulary metadata"
            >
              <Stack gap="medium">
                <Inline gap="small">
                  <StatusBadge tone="accent">CEFR {cefrLevel}</StatusBadge>
                  <StatusBadge tone="success">Validated</StatusBadge>
                  <StatusBadge tone="warning">Needs review</StatusBadge>
                </Inline>
                <Divider />
                <Inline gap="small">
                  <TagChip>IELTS</TagChip>
                  <TagChip>Academic</TagChip>
                  <TagChip
                    onRemove={() => {
                      // Visual checkpoint only; removal state arrives with Library.
                    }}
                    removeLabel="Remove Writing tag"
                  >
                    Writing
                  </TagChip>
                </Inline>
              </Stack>
            </Section>

            <Section
              description="Keyboard, pointer, reduced-motion, and narrow-window behavior are part of the component contract."
              title="Accessibility contract"
            >
              <ul className="component-foundation__contract">
                <li>
                  <AppIcon name="check" size={16} />
                  Visible focus rings on every interactive control
                </li>
                <li>
                  <AppIcon name="check" size={16} />
                  Native labels, descriptions, validation, and disabled states
                </li>
                <li>
                  <AppIcon name="check" size={16} />
                  Motion reduced through system preference or application setting
                </li>
                <li>
                  <AppIcon name="check" size={16} />
                  SVG icons remain sharp at every desktop scale
                </li>
              </ul>
            </Section>

            <p className="component-foundation__next">
              Next checkpoint: assemble these primitives into the persistent sidebar, top bar, and
              exactly three application routes.
            </p>
          </Stack>
        </div>
      </div>
    </main>
  );
}
