interface EnglishFocusMarkProps {
  readonly size?: number;
  readonly label?: string;
  readonly className?: string;
}

export function EnglishFocusMark({
  size = 40,
  label = "English Focus",
  className
}: EnglishFocusMarkProps) {
  return (
    <svg
      aria-label={label}
      className={className}
      height={size}
      role="img"
      viewBox="0 0 40 40"
      width={size}
    >
      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <text
        x="20"
        y="25.2"
        fill="currentColor"
        fontFamily='Georgia, "Times New Roman", serif'
        fontSize="16"
        letterSpacing="0.6"
        textAnchor="middle"
      >
        EF
      </text>
    </svg>
  );
}
