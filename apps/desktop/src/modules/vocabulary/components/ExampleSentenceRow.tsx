import type { ExampleSentence } from "@platform/domain";

import { StatusBadge } from "../../../components";

interface ExampleSentenceRowProps {
  readonly example: ExampleSentence;
  readonly index: number;
}

export function ExampleSentenceRow({ example, index }: ExampleSentenceRowProps) {
  return (
    <li className="example-sentence-row">
      <span className="example-sentence-row__number" aria-hidden="true">
        {index + 1}
      </span>
      <div>
        <p className="example-sentence-row__english">{example.sentenceEn}</p>
        <p className="example-sentence-row__turkish">{example.translationTr}</p>
        <div className="example-sentence-row__metadata">
          {example.grammarLabel === undefined ? null : (
            <StatusBadge tone="accent">{example.grammarLabel}</StatusBadge>
          )}
          {example.context === undefined ? null : <StatusBadge>{example.context}</StatusBadge>}
        </div>
      </div>
    </li>
  );
}
