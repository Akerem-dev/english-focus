import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppIcon } from "../../src/design-system";
import {
  Button,
  SearchInput,
  Section,
  SwitchField,
  TagChip,
  TextField
} from "../../src/components";

describe("accessible component primitives", () => {
  it("renders button state and icon-only labels", () => {
    const markup = renderToStaticMarkup(
      <Button isLoading leadingIcon={<AppIcon name="search" />} variant="primary">
        Search
      </Button>
    );

    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("disabled");
    expect(markup).toContain('data-variant="primary"');
  });

  it("associates text fields with helper and error content", () => {
    const markup = renderToStaticMarkup(
      <TextField error="Use one word." helperText="English only." id="word" label="Word" />
    );

    expect(markup).toContain('for="word"');
    expect(markup).toContain('aria-describedby="word-helper word-error"');
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain('role="alert"');
  });

  it("gives clear-search and removable-tag buttons accessible names", () => {
    const markup = renderToStaticMarkup(
      <>
        <SearchInput
          label="Search vocabulary"
          onClear={() => undefined}
          readOnly
          value="maintain"
        />
        <TagChip onRemove={() => undefined} removeLabel="Remove IELTS tag">
          IELTS
        </TagChip>
      </>
    );

    expect(markup).toContain('aria-label="Clear search"');
    expect(markup).toContain('aria-label="Remove IELTS tag"');
  });

  it("renders native switch semantics and section hierarchy", () => {
    const markup = renderToStaticMarkup(
      <Section title="Preferences">
        <SwitchField checked label="Show grammar" readOnly />
      </Section>
    );

    expect(markup).toContain("<h2>Preferences</h2>");
    expect(markup).toContain('role="switch"');
    expect(markup).toContain("checked");
  });
});
