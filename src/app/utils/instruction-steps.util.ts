// Abbreviations that end in a period mid-sentence ("1 c. Flour", "approx. 2 hrs."),
// so a period after one of these never starts a new step.
const ABBREVIATIONS = new Set([
  'approx', 'c', 'dr', 'doz', 'e.g', 'etc', 'ft', 'gal', 'hr', 'hrs', 'i.e', 'in', 'lb', 'lbs',
  'min', 'mins', 'mr', 'mrs', 'ms', 'no', 'oz', 'pkg', 'pkgs', 'pt', 'qt', 'sq', 'st', 't',
  'tbsp', 'tbs', 'tsp', 'vs',
]);

/**
 * Splits a recipe's instructions into steps for cook mode. Text that already has line
 * breaks (photo transcriptions keep one step per line) splits on those; one long
 * paragraph splits on sentence ends.
 */
export function splitSteps(instructions: string | undefined): string[] {
  const text = (instructions ?? '').trim();
  if (!text) {
    return [];
  }

  if (text.includes('\n')) {
    return text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line !== '');
  }

  return splitSentences(text);
}

function splitSentences(text: string): string[] {
  const steps: string[] = [];
  // A sentence ends at . ! or ? followed by space and a capital or digit, e.g. "350°. Mix".
  const boundary = /[.!?]\s+(?=[A-Z0-9])/g;
  let start = 0;
  let match: RegExpExecArray | null;

  while ((match = boundary.exec(text)) !== null) {
    const end = match.index + 1;
    if (endsWithAbbreviation(text.slice(start, end))) {
      continue;
    }

    steps.push(text.slice(start, end).trim());
    start = boundary.lastIndex;
  }

  const rest = text.slice(start).trim();
  if (rest) {
    steps.push(rest);
  }

  return steps;
}

function endsWithAbbreviation(sentence: string): boolean {
  if (!sentence.endsWith('.')) {
    return false;
  }

  const lastWord = sentence.slice(0, -1).split(/\s+/).pop() ?? '';
  return ABBREVIATIONS.has(lastWord.toLowerCase());
}
