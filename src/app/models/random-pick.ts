export interface RandomPickResult {
  filename: string;
  picked: string[];
}

// Picks a recipe not yet picked this cycle. Once every recipe has been picked
// a new cycle starts, skipping the current pick so it never shows twice in a row.
export function pickRandomRecipe(
  filenames: string[],
  picked: string[],
  current: string | null,
  random: () => number = Math.random,
): RandomPickResult | undefined {
  if (filenames.length === 0) {
    return undefined;
  }

  // Drop recipes removed from the list since they were picked.
  let history = picked.filter((it) => filenames.includes(it));
  let pool = filenames.filter((it) => !history.includes(it));

  if (pool.length === 0) {
    history = [];
    pool = filenames;
  }

  if (pool.length > 1 && current) {
    pool = pool.filter((it) => it !== current);
  }

  const filename = pool[Math.floor(random() * pool.length)];

  return { filename, picked: [...history, filename] };
}

export function remainingRandomPicks(
  filenames: string[],
  picked: string[],
): number {
  return filenames.filter((it) => !picked.includes(it)).length;
}
