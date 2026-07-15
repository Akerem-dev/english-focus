import { Modal } from "../../components";
import { KEYBOARD_SHORTCUTS } from "./shortcutRegistry";

interface KeyboardShortcutsDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

const GROUPS = ["Navigation", "Actions", "Interface"] as const;

export function KeyboardShortcutsDialog({ onClose, open }: KeyboardShortcutsDialogProps) {
  return (
    <Modal
      description="Global shortcuts are disabled while typing in form fields, except explicit dialog save actions."
      onClose={onClose}
      open={open}
      size="large"
      title="Keyboard shortcuts"
    >
      <div className="keyboard-shortcuts">
        {GROUPS.map((group) => {
          const shortcuts = KEYBOARD_SHORTCUTS.filter((shortcut) => shortcut.group === group);

          return (
            <section className="keyboard-shortcuts__group" key={group}>
              <header>
                <h3>{group}</h3>
                <span>{shortcuts.length} shortcuts</span>
              </header>
              <div className="keyboard-shortcuts__list">
                {shortcuts.map((shortcut) => (
                  <div className="keyboard-shortcuts__row" key={shortcut.id}>
                    <span className="keyboard-shortcuts__keys" aria-label={shortcut.keys.join(" plus ")}>
                      {shortcut.keys.map((key) => (
                        <kbd key={key}>{key}</kbd>
                      ))}
                    </span>
                    <span className="keyboard-shortcuts__copy">
                      <strong>{shortcut.label}</strong>
                      <small>{shortcut.description}</small>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </Modal>
  );
}
