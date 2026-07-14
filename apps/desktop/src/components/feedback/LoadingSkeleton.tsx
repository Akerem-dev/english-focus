import { joinClassNames } from "../componentUtils";

export interface LoadingSkeletonProps {
  readonly lines?: number;
  readonly label?: string;
  readonly className?: string;
}

export function LoadingSkeleton({
  className,
  label = "Loading content",
  lines = 3
}: LoadingSkeletonProps) {
  const lineCount = Math.max(1, Math.min(lines, 8));

  return (
    <div
      aria-busy="true"
      aria-label={label}
      className={joinClassNames("loading-skeleton", className)}
      role="status"
    >
      {Array.from({ length: lineCount }, (_, index) => (
        <span aria-hidden="true" className="loading-skeleton__line" key={index} />
      ))}
    </div>
  );
}
