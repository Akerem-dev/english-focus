export const designTokens = {
  color: {
    canvas: "#f6f3ed",
    sidebar: "#f1ede6",
    surface: "#fffdfa",
    surfaceMuted: "#f7f3ec",
    surfaceStrong: "#eee8df",
    text: "#24211f",
    textSecondary: "#625d57",
    textMuted: "#837c74",
    border: "#ddd6cc",
    borderStrong: "#c9c0b5",
    accent: "#7b1722",
    accentHover: "#68121b",
    accentPressed: "#551017",
    accentSoft: "#f3e6e7",
    success: "#39714f",
    successSoft: "#e7f1ea",
    warning: "#9a6926",
    warningSoft: "#f6ecdc",
    danger: "#a3383f",
    dangerSoft: "#f6e4e5",
    focus: "#315f8a",
    overlay: "rgb(31 28 26 / 46%)"
  },
  typography: {
    family: {
      display: 'Georgia, "Times New Roman", serif',
      ui: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"SFMono-Regular", Consolas, "Liberation Mono", monospace'
    },
    size: {
      caption: "0.75rem",
      bodySmall: "0.875rem",
      body: "1rem",
      headingSmall: "1.25rem",
      heading: "1.75rem",
      displaySmall: "2.5rem",
      display: "3.5rem"
    },
    lineHeight: {
      compact: 1.2,
      normal: 1.5,
      reading: 1.72
    }
  },
  spacing: {
    0: "0",
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.5rem",
    6: "2rem",
    7: "3rem",
    8: "4rem",
    9: "6rem"
  },
  radius: {
    small: "0.375rem",
    medium: "0.625rem",
    large: "0.875rem",
    extraLarge: "1.125rem",
    pill: "999rem"
  },
  elevation: {
    low: "0 0.125rem 0.5rem rgb(37 31 28 / 6%)",
    medium: "0 0.75rem 2rem rgb(37 31 28 / 10%)",
    high: "0 1.5rem 4rem rgb(37 31 28 / 14%)",
    overlay: "0 1.75rem 5rem rgb(26 22 20 / 20%)"
  },
  motion: {
    duration: {
      fast: "120ms",
      normal: "180ms",
      slow: "240ms"
    },
    easing: {
      standard: "cubic-bezier(0.2, 0, 0, 1)",
      emphasized: "cubic-bezier(0.2, 0.8, 0.2, 1)"
    }
  },
  focus: {
    width: "0.125rem",
    offset: "0.1875rem"
  },
  layer: {
    base: 0,
    sticky: 20,
    dropdown: 40,
    overlay: 60,
    modal: 80,
    toast: 100
  },
  breakpoint: {
    compact: 720,
    narrow: 960,
    wide: 1280
  },
  layout: {
    sidebar: "14.5rem",
    sidebarCollapsed: "4.5rem",
    contentReading: "48rem",
    contentApp: "80rem"
  }
} as const;

export type DesignTokens = typeof designTokens;
