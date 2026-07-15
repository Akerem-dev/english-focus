export type ExampleSentenceDisplayCount = 5 | 10;

export interface ContentSettings {
  readonly showEtymology: boolean;
  readonly showCommonMistakes: boolean;
  readonly exampleSentenceCount: ExampleSentenceDisplayCount;
}
