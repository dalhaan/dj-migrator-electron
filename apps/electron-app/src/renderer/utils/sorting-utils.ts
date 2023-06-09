import { SortType } from "rsuite/esm/Table";

// Extract camelot number & letter from string
// "12A" => ["12A", "12", "A"]
const camelotKeyMatcher = /^(\d{1,2})([AB])$/;

/**
 * Sort by camelot number. If they're the same, sort by their camelot letter.
 * @param keyA - Camelot key
 * @param keyB - Camelot key
 */
export function sortCamelotKeys(
  keyA: string | undefined,
  keyB: string | undefined,
  sortType: SortType
): number {
  if (!keyA) return 1;
  if (!keyB) return -1;

  const matchesA = keyA.match(camelotKeyMatcher);
  const matchesB = keyB.match(camelotKeyMatcher);

  const camelotNumberA = matchesA?.[1];
  const camelotLetterA = matchesA?.[2];
  const camelotNumberB = matchesB?.[1];
  const camelotLetterB = matchesB?.[2];

  if (!camelotNumberA) return -1;
  if (!camelotNumberB) return 1;

  if (sortType === "asc") {
    const numberCompareValue = Number(camelotNumberA) - Number(camelotNumberB);

    if (numberCompareValue === 0 && camelotLetterA && camelotLetterB) {
      return camelotLetterA.localeCompare(camelotLetterB);
    }

    return numberCompareValue;
  } else {
    const numberCompareValue = Number(camelotNumberB) - Number(camelotNumberA);

    if (numberCompareValue === 0 && camelotLetterA && camelotLetterB) {
      return camelotLetterB.localeCompare(camelotLetterA);
    }

    return numberCompareValue;
  }
}

/**
 * Sorts string or number array.
 */
export function defaultSort(
  a: string | number | undefined,
  b: string | number | undefined,
  sortType: SortType
): number {
  if (typeof a === "number" && typeof b === "number") {
    return sortType === "asc" ? a - b : b - a;
  } else if (typeof a === "string" && typeof b === "string") {
    return sortType === "asc" ? a.localeCompare(b) : b.localeCompare(a);
  } else if (a === undefined) {
    return 1;
  } else if (b === undefined) {
    return -1;
  }

  return 0;
}
