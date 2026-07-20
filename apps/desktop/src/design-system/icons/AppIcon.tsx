import type { ReactNode } from "react";

export type AppIconName =
  | "book-open"
  | "books"
  | "check"
  | "chevron-down"
  | "chevron-right"
  | "close"
  | "command"
  | "copy"
  | "download"
  | "search"
  | "settings"
  | "star"
  | "upload"
  | "warning";

interface AppIconProps {
  readonly name: AppIconName;
  readonly size?: number;
  readonly label?: string;
  readonly className?: string;
}

function renderGlyph(name: AppIconName): ReactNode {
  switch (name) {
    case "book-open":
      return (
        <>
          <path d="M3.5 5.5c2.6-.7 5.1-.3 7 1.1v12.2c-1.9-1.4-4.4-1.8-7-1.1V5.5Z" />
          <path d="M20.5 5.5c-2.6-.7-5.1-.3-7 1.1v12.2c1.9-1.4 4.4-1.8 7-1.1V5.5Z" />
        </>
      );
    case "books":
      return (
        <>
          <rect x="3.5" y="4" width="4" height="16" rx="1" />
          <rect x="9.5" y="3" width="4" height="17" rx="1" />
          <path d="m15.5 4.5 3.1-.7 3.1 14.8-3.1.7-3.1-14.8Z" />
        </>
      );
    case "check":
      return <path d="m5 12.5 4.2 4.2L19 7" />;
    case "chevron-down":
      return <path d="m6.5 9 5.5 5.5L17.5 9" />;
    case "chevron-right":
      return <path d="m9 6.5 5.5 5.5L9 17.5" />;
    case "close":
      return (
        <>
          <path d="m6 6 12 12" />
          <path d="M18 6 6 18" />
        </>
      );
    case "command":
      return (
        <>
          <path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6Z" />
        </>
      );
    case "copy":
      return (
        <>
          <rect x="8" y="8" width="11" height="11" rx="2" />
          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
        </>
      );
    case "download":
      return (
        <>
          <path d="M12 3.5v11" />
          <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
          <path d="M4.5 19.5h15" />
        </>
      );
    case "search":
      return (
        <>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m15.5 15.5 4.5 4.5" />
        </>
      );
    case "settings":
      return (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
        </>
      );
    case "star":
      return (
        <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
      );
    case "upload":
      return (
        <>
          <path d="M12 20.5v-11" />
          <path d="m7.5 13.5 4.5-4.5 4.5 4.5" />
          <path d="M4.5 4.5h15" />
        </>
      );
    case "warning":
      return (
        <>
          <path d="M12 3.5 21 20H3L12 3.5Z" />
          <path d="M12 9v5" />
          <path d="M12 17.5h.01" />
        </>
      );
  }
}

export function AppIcon({ name, size = 20, label, className }: AppIconProps) {
  const isDecorative = label === undefined;

  return (
    <svg
      aria-hidden={isDecorative ? true : undefined}
      aria-label={label}
      className={className}
      fill="none"
      height={size}
      role={isDecorative ? undefined : "img"}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      width={size}
    >
      {renderGlyph(name)}
    </svg>
  );
}
