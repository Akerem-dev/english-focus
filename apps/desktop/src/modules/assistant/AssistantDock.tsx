import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ROUTE_PATHS } from "../../app/router";
import { Button, IconButton } from "../../components";
import { AppIcon } from "../../design-system";

import mascotMini from "./assets/mascot/mascot-mini.png";
import mascotReady from "./assets/mascot/mascot-ready.png";

type AssistantMessage = Readonly<{
  id: number;
  author: "assistant" | "user";
  text: string;
}>;

const INITIAL_MESSAGES: readonly AssistantMessage[] = Object.freeze([
  {
    id: 1,
    author: "assistant",
    text: "Tell me the English word you want to add. Nothing is saved until you review it."
  }
]);

function supportsAssistant(pathname: string): boolean {
  return pathname === ROUTE_PATHS.vocabulary || pathname === ROUTE_PATHS.library;
}

export function AssistantDock() {
  const location = useLocation();
  const navigate = useNavigate();
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<readonly AssistantMessage[]>(INITIAL_MESSAGES);
  const visible = supportsAssistant(location.pathname);

  useEffect(() => {
    if (!visible) {
      setOpen(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!visible) {
    return null;
  }

  function focusWordInput() {
    setOpen(true);
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const word = input.trim();

    if (word.length === 0) {
      inputRef.current?.focus();
      return;
    }

    const nextId = messages.length + 1;
    setMessages((current) => [
      ...current,
      { id: nextId, author: "user", text: word },
      {
        id: nextId + 1,
        author: "assistant",
        text: `I’ll prepare “${word}” for review here. You will check the meanings and examples before it is added.`
      }
    ]);
    setInput("");
  }

  return (
    <aside className="assistant-dock" data-open={open || undefined}>
      {open ? (
        <section
          aria-labelledby={titleId}
          aria-modal="false"
          className="assistant-panel"
          role="dialog"
        >
          <header className="assistant-panel__header">
            <img alt="" className="assistant-panel__mascot" src={mascotReady} />
            <div className="assistant-panel__heading">
              <h2 id={titleId}>Word helper</h2>
              <p>Ready when you are</p>
            </div>
            <IconButton
              className="assistant-panel__close"
              icon={<AppIcon name="close" size={18} />}
              label="Close word helper"
              onClick={() => {
                setOpen(false);
              }}
              size="small"
            />
          </header>

          <div aria-live="polite" className="assistant-messages">
            {messages.map((message) => (
              <div
                className="assistant-message"
                data-author={message.author}
                key={message.id}
              >
                <p>{message.text}</p>
              </div>
            ))}
          </div>

          <div className="assistant-shortcuts" aria-label="Word helper suggestions">
            <button onClick={focusWordInput} type="button">
              <AppIcon name="book-open" size={18} />
              <span>Add a new word</span>
            </button>
            <button
              onClick={() => {
                navigate(ROUTE_PATHS.library);
                setOpen(false);
              }}
              type="button"
            >
              <AppIcon name="books" size={18} />
              <span>Open recent words</span>
            </button>
          </div>

          <form className="assistant-composer" onSubmit={handleSubmit}>
            <label className="visually-hidden" htmlFor="assistant-word-input">
              English word
            </label>
            <input
              autoComplete="off"
              id="assistant-word-input"
              maxLength={80}
              onChange={(event) => {
                setInput(event.currentTarget.value);
              }}
              placeholder="Type an English word"
              ref={inputRef}
              spellCheck="false"
              value={input}
            />
            <Button disabled={input.trim().length === 0} size="small" type="submit" variant="primary">
              Continue
            </Button>
          </form>
        </section>
      ) : (
        <button
          aria-label="Open word helper"
          className="assistant-launcher"
          onClick={() => {
            setOpen(true);
          }}
          title="Open word helper"
          type="button"
        >
          <img alt="" src={mascotMini} />
        </button>
      )}
    </aside>
  );
}
