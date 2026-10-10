import { RenderMode, ServerRoute } from '@angular/ssr';
import { readRecipeIndex } from './recipe-index.server';
import { recipeSlug } from './utils/recipe-url.util';

/** GitHub Pages only serves files, so every recipe page is prerendered at build time. */
export const serverRoutes: ServerRoute[] = [
  {
    path: ':id/:name',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return [...readRecipeIndex().values()].map(recipe => ({
        id: recipe.filename,
        name: recipeSlug(recipe.name),
      }));
    },
  },
  { path: 'lists', renderMode: RenderMode.Prerender },
  // A bare or mistyped id has no file; Pages serves 404.html and the client fixes the URL.
  { path: ':id', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Prerender },
];
