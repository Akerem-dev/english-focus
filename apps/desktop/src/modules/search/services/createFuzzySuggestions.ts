import type { VocabularyEntry } from "@platform/domain";

function levenshteinDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        (current[rightIndex - 1] ?? 0) + 1,
        (previous[rightIndex] ?? 0) + 1,
        (previous[rightIndex - 1] ?? 0) + substitutionCost
      );
    }

    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length] ?? Math.max(left.length, right.length);
}

function suggestionThreshold(query: string): number {
  if (query.length <= 4) {
    return 1;
  }

  if (query.length <= 8) {
    return 2;
  }

  return 3;
}

export function createFuzzySuggestions(
  normalizedQuery: string,
  entries: readonly VocabularyEntry[],
  limit = 3
): readonly string[] {
  const threshold = suggestionThreshold(normalizedQuery);
  const ranked = entries
    .map((entry) => {
      const candidateForms = [entry.normalizedWord, ...entry.aliases];
      const distance = Math.min(
        ...candidateForms.map((candidate) => levenshteinDistance(normalizedQuery, candidate))
      );

      return {
        word: entry.normalizedWord,
        distance
      };
    })
    .filter((candidate) => candidate.distance <= threshold)
    .sort((left, right) => left.distance - right.distance || left.word.localeCompare(right.word));

  return [...new Set(ranked.map((candidate) => candidate.word))].slice(0, limit);
}
