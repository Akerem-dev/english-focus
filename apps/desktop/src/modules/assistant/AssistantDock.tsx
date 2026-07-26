import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useVocabularyRepository } from "../../app/providers";
import { buildVocabularyEntryPath, ROUTE_PATHS } from "../../app/router";
import { Button, IconButton } from "../../components";
import { AppIcon } from "../../design-system";
import { ASSISTANT_REQUEST_EVENT, type AssistantRequestDetail } from "./assistantEvents";
import launcherFrame from "./assets/launcher/assistant-launcher-frame.png";
import {
  AssistantLauncherMascot,
  AssistantPanelMascot,
  type AssistantMascotState
} from "./AssistantMascot";
import {
  AssistantWordPreview,
  createAssistantWordPreview,
  type AssistantWordPreviewModel
} from "./AssistantWordPreview";

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

const STATUS_BY_STATE: Readonly<Record<AssistantMascotState, string>> = Object.freeze({
  ready: "Add a word to your library",
  thinking: "Preparing a review",
  success: "Saved to your library",
  confused: "Check the word and try again",
  sleeping: "Resting nearby"
});

const MOCK_PREPARATION_DELAY_MS = 2400;
const HEADWORD_PATTERN =
  /^[A-Za-z]+(?:['’-][A-Za-z]+)*(?:\s+[A-Za-z]+(?:['’-][A-Za-z]+)*){0,2}$/u;

function supportsAssistant(pathname: string): boolean {
  return pathname === ROUTE_PATHS.vocabulary || pathname === ROUTE_PATHS.library;
}

function isPlausibleHeadword(value: string): boolean {
  return HEADWORD_PATTERN.test(value);
}

export function AssistantDock() {
  const location = useLocation();
  const navigate = useNavigate();
  const { contentSource } = useVocabularyRepository();
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const attentionTimerRef = useRef<number | undefined>(undefined);
  const responseTimerRef = useRef<number | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [attention, setAttention] = useState(false);
  const [input, setInput] = useState("");
  const [mascotState, setMascotState] = useState<AssistantMascotState>("ready");
  const [messages, setMessages] = useState<readonly AssistantMessage[]>(INITIAL_MESSAGES);
  const [preview, setPreview] = useState<AssistantWordPreviewModel | undefined>();
  const visible = supportsAssistant(location.pathname);
  const isPreparing = mascotState === "thinking";
  const launcherState = attention ? "awake" : "sleeping";

  useEffect(() => {
    if (!visible) {
      setOpen(false);
      setAttention(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setAttention(false);
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

  useEffect(() => {
    function handleAssistantRequest(event: Event) {
      const detail = (event as CustomEvent<AssistantRequestDetail>).detail;

      if (detail.word !== undefined) {
        setInput(detail.word);
        setPreview(undefined);
      }

      setMascotState("ready");
      setAttention(false);
      window.clearTimeout(attentionTimerRef.current);

      window.requestAnimationFrame(() => {
        setAttention(true);
      });

      attentionTimerRef.current = window.setTimeout(() => {
        setAttention(false);
      }, 1100);

      if (detail.kind === "open") {
        setOpen(true);
      }
    }

    window.addEventListener(ASSISTANT_REQUEST_EVENT, handleAssistantRequest);

    return () => {
      window.removeEventListener(ASSISTANT_REQUEST_EVENT, handleAssistantRequest);
      window.clearTimeout(attentionTimerRef.current);
      window.clearTimeout(responseTimerRef.current);
    };
  }, []);

  if (!visible) {
    return null;
  }

  function openAssistant() {
    setMascotState("ready");
    setOpen(true);
  }

  function focusWordInput() {
    setPreview(undefined);
    openAssistant();
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  function editPreviewWord() {
    if (preview === undefined) {
      return;
    }

    setInput(preview.word);
    setPreview(undefined);
    setMascotState("ready");
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }

  function openExistingPreview() {
    if (preview?.complete !== true) {
      return;
    }

    navigate(buildVocabularyEntryPath(preview.normalizedWord));
    setOpen(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const word = input.trim();

    if (word.length === 0) {
      inputRef.current?.focus();
      return;
    }

    const messageId = Date.now();

    if (!isPlausibleHeadword(word)) {
      setPreview(undefined);
      setMascotState("confused");
      setMessages((current) => [
        ...current,
        {
          id: messageId,
          author: "assistant",
          text: "Please enter one English word or a short phrasal verb."
        }
      ]);
      inputRef.current?.focus();
      return;
    }

    const normalizedWord = word.toLocaleLowerCase("en-US");
    const existingEntry = contentSource.getEntryByNormalizedWord(normalizedWord);

    window.clearTimeout(responseTimerRef.current);
    setPreview(undefined);
    setMascotState("thinking");
    setMessages((current) => [...current, { id: messageId, author: "user", text: word }]);
    setInput("");

    responseTimerRef.current = window.setTimeout(() => {
      const nextPreview = createAssistantWordPreview(word, existingEntry);
      setPreview(nextPreview);
      setMessages((current) => [
        ...current,
        {
          id: messageId + 1,
          author: "assistant",
          text: nextPreview.complete
            ? `I found “${nextPreview.word}” in your local vocabulary. Review it below.`
            : `I opened a review for “${nextPreview.word}”. Its meaning and examples will appear here before it can be added.`
        }
      ]);
      setMascotState("ready");
    }, MOCK_PREPARATION_DELAY_MS);
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
            <AssistantPanelMascot state={mascotState} />
            <div className="assistant-panel__heading">
              <h2 id={titleId}>Word helper</h2>
              <p>{STATUS_BY_STATE[mascotState]}</p>
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
            {preview === undefined ? null : (
              <AssistantWordPreview
                onEdit={editPreviewWord}
                onOpenExisting={openExistingPreview}
                preview={preview}
              />
            )}
          </div>

          {preview === undefined ? (
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
          ) : null}

          <form className="assistant-composer" onSubmit={handleSubmit}>
            <label className="visually-hidden" htmlFor="assistant-word-input">
              English word
            </label>
            <input
              autoComplete="off"
              disabled={isPreparing}
              id="assistant-word-input"
              maxLength={80}
              onChange={(event) => {
                setInput(event.currentTarget.value);
                if (mascotState === "confused") {
                  setMascotState("ready");
                }
              }}
              placeholder="Type an English word"
              ref={inputRef}
              spellCheck="false"
              value={input}
            />
            <Button
              disabled={input.trim().length === 0}
              isLoading={isPreparing}
              size="small"
              type="submit"
              variant="primary"
            >
              Continue
            </Button>
          </form>
        </section>
      ) : (
        <button
          aria-label="Open word helper"
          className="assistant-launcher"
          data-attention={attention || undefined}
          data-state={launcherState}
          onClick={openAssistant}
          title="Open word helper"
          type="button"
        >
          <span aria-hidden="true" className="assistant-launcher__glow" />
          <img alt="" className="assistant-launcher__frame" src={launcherFrame} />
          <AssistantLauncherMascot awake={attention} />
        </button>
      )}
    </aside>
  );
}
