import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { Modal, SearchInput } from "../../components";
import { AppIcon } from "../../design-system";
import type { CommandDefinition } from "./commandRegistry";

interface CommandBarProps {
  readonly commands: readonly CommandDefinition[];
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onExecute: (command: CommandDefinition) => void;
}

function commandSearchText(command: CommandDefinition): string {
  return [command.label, command.description, command.category, ...command.keywords]
    .join(" ")
    .toLocaleLowerCase("en-US");
}

export function CommandBar({ commands, onClose, onExecute, open }: CommandBarProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("en-US");

    if (normalizedQuery.length === 0) {
      return commands;
    }

    return commands.filter((command) => commandSearchText(command).includes(normalizedQuery));
  }, [commands, query]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setQuery("");
    setActiveIndex(0);
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [open]);

  useEffect(() => {
    if (activeIndex >= filteredCommands.length) {
      setActiveIndex(Math.max(0, filteredCommands.length - 1));
    }
  }, [activeIndex, filteredCommands.length]);

  function execute(command: CommandDefinition) {
    onExecute(command);
    onClose();
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        filteredCommands.length === 0 ? 0 : (current + 1) % filteredCommands.length
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        filteredCommands.length === 0
          ? 0
          : (current - 1 + filteredCommands.length) % filteredCommands.length
      );
      return;
    }

    if (event.key === "Enter") {
      const command = filteredCommands[activeIndex];

      if (command !== undefined) {
        event.preventDefault();
        execute(command);
      }
    }
  }

  return (
    <Modal
      description="Search navigation, local actions, and help. Arrow keys move; Enter runs the selected command."
      onClose={onClose}
      open={open}
      size="large"
      title="Command bar"
    >
      <div className="command-bar">
        <SearchInput
          ref={inputRef}
          aria-activedescendant={
            filteredCommands[activeIndex] === undefined
              ? undefined
              : `command-${filteredCommands[activeIndex].id}`
          }
          aria-controls="command-bar-results"
          aria-expanded={open}
          aria-label="Search commands"
          autoComplete="off"
          data-autofocus="true"
          label="Search commands"
          onChange={(event) => {
            setQuery(event.currentTarget.value);
            setActiveIndex(0);
          }}
          onClear={() => {
            setQuery("");
            setActiveIndex(0);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder="Search commands, routes, or actions"
          role="combobox"
          value={query}
        />

        <div className="command-bar__hint" aria-hidden="true">
          <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
          <span><kbd>Enter</kbd> run</span>
          <span><kbd>Esc</kbd> close</span>
        </div>

        <div className="command-bar__results" id="command-bar-results" role="listbox">
          {filteredCommands.length === 0 ? (
            <div className="command-bar__empty">
              <AppIcon name="search" size={24} />
              <strong>No matching command</strong>
              <p>Try a route name such as Vocabulary, Library, Settings, Import, or Export.</p>
            </div>
          ) : (
            filteredCommands.map((command, index) => (
              <button
                aria-selected={activeIndex === index}
                className="command-bar__result"
                data-active={activeIndex === index || undefined}
                id={`command-${command.id}`}
                key={command.id}
                onClick={() => {
                  execute(command);
                }}
                onMouseEnter={() => {
                  setActiveIndex(index);
                }}
                role="option"
                type="button"
              >
                <span className="command-bar__result-icon" aria-hidden="true">
                  <AppIcon name={command.icon} size={19} />
                </span>
                <span className="command-bar__result-copy">
                  <strong>{command.label}</strong>
                  <small>{command.description}</small>
                </span>
                <span className="command-bar__result-meta">
                  <span>{command.category}</span>
                  {command.shortcut === undefined ? null : <kbd>{command.shortcut}</kbd>}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
