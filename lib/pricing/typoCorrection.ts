export type TypoVocabularyCandidate = {
  term: string;
  documentCount: number;
};

export type TypoCorrection = TypoVocabularyCandidate & {
  distance: number;
  similarity: number;
};

export function searchTrigrams(value: string): string[] {
  if (value.length < 3) return [];
  return [
    ...new Set(
      Array.from({ length: value.length - 2 }, (_, index) =>
        value.slice(index, index + 3),
      ),
    ),
  ];
}

export function damerauLevenshtein(left: string, right: string): number {
  const rows = left.length + 1;
  const columns = right.length + 1;
  const distance = Array.from({ length: rows }, () =>
    Array<number>(columns).fill(0),
  );
  for (let row = 0; row < rows; row += 1) distance[row][0] = row;
  for (let column = 0; column < columns; column += 1) {
    distance[0][column] = column;
  }
  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const substitution = left[row - 1] === right[column - 1] ? 0 : 1;
      distance[row][column] = Math.min(
        distance[row - 1][column] + 1,
        distance[row][column - 1] + 1,
        distance[row - 1][column - 1] + substitution,
      );
      if (
        row > 1 &&
        column > 1 &&
        left[row - 1] === right[column - 2] &&
        left[row - 2] === right[column - 1]
      ) {
        distance[row][column] = Math.min(
          distance[row][column],
          distance[row - 2][column - 2] + 1,
        );
      }
    }
  }
  return distance[left.length][right.length];
}

export function dominantTypoCorrection(
  input: string,
  candidates: readonly TypoVocabularyCandidate[],
): TypoCorrection | null {
  if (!/^[a-z]{4,}$/.test(input)) return null;
  const maximumDistance = input.length <= 7 ? 1 : 2;
  const ranked = candidates
    .map((candidate) => {
      const distance = damerauLevenshtein(input, candidate.term);
      return {
        ...candidate,
        distance,
        similarity:
          1 - distance / Math.max(input.length, candidate.term.length),
      };
    })
    .filter((candidate) => candidate.distance <= maximumDistance)
    .sort(
      (left, right) =>
        left.distance - right.distance ||
        right.similarity - left.similarity ||
        right.documentCount - left.documentCount ||
        left.term.localeCompare(right.term),
    );
  const best = ranked[0];
  if (!best) return null;
  const runnerUp = ranked[1];
  if (
    runnerUp &&
    best.distance === runnerUp.distance &&
    best.similarity - runnerUp.similarity < 0.12
  ) {
    return null;
  }
  return best;
}
