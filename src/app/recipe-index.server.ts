import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RecipeMeta } from './services/seo.service';

let index: Map<string, RecipeMeta> | undefined;

/** Reads the combined recipes.json (written by `npm run recipes:combine`) at build time. */
export function readRecipeIndex(): ReadonlyMap<string, RecipeMeta> {
  if (!index) {
    const recipes: RecipeMeta[] = JSON.parse(
      readFileSync(join(process.cwd(), 'src/assets/recipes.json'), 'utf8'),
    );
    index = new Map(
      recipes.map(({ filename, name, author }) => [filename, { filename, name, author }]),
    );
  }

  return index;
}
