# Family Recipes

Angular 22 site holding the family recipe collection: search, recipe pages with batch scaling, favorites, and
shopping lists. Built with `outputMode: "static"`, so every recipe page is prerendered to its own `index.html` and
served from GitHub Pages at `family-recipes.ryan-brock.com`. No backend of its own.

## Commands

- Install: `npm ci` (Node version in `.nvmrc`)
- Dev server: `npm start` — `prestart` runs `recipes:combine` first
- Test all: `npm test` (Vitest in jsdom via `@angular/build:unit-test`), or `npx ng test --watch=false` as CI runs it
- Combine recipes: `npm run recipes:combine` — rerun after adding or editing a file in `src/assets/recipes/`
- Build: `npm run deploy` — `ng build` (prerenders every recipe) then `scripts/finish-static-build.mjs`, which
  writes `sitemap.xml` and copies `index.csr.html` to `404.html`. Output in `dist/family-recipes/`
- Deploy: CI only, `.github/workflows/deploy.yml` on push to `master` (combine, tests, build, `peaceiris/actions-gh-pages`)

## Data

- One recipe per file: `src/assets/recipes/NNNN.json`, zero-padded, numbered in order. The number is the recipe id
  and its `filename`. Shape is `Recipe` in `src/app/models/recipe.interface.ts`; `src/assets/recipe-format.json`
  is a sample. `category` is the `Category` enum in `src/app/models/category.enum.ts`
- An ingredient's unit is its own canonical `unit` field (`cup`, `tsp`, `tbsp`, `lb`...), not part of `name`;
  `utils/ingredient-unit.util.ts` parses and labels units. Both recipe pipelines split units before writing, and
  `npm run recipes:split-units` does it for any file added by hand. That util is also `require`d by the Node
  scripts (Node strips the types), so keep it import-free with no enums
- `scripts/combineRecipes.js` merges every file into `src/assets/recipes.json` (gitignored, never commit it) and
  adds `filename`. The app fetches that one file; prerendering reads it from disk via `recipe-index.server.ts`
- New recipes arrive two ways:
  - `.github/workflows/recipe_processing.yml` pulls pending submissions (from the
    [add-recipe](https://github.com/rbrock44/add-recipe) form) from `home-page-api.ryan-brock.com` with
    `scripts/processRecipes.js`, commits them as the bot, starts `deploy.yml` (bot pushes can't trigger it), then
    deletes only the ids it processed from the API
  - `npm run recipes:from-images` (`scripts/recipesFromImages.js`) reads recipe photos with Claude vision. Needs
    `ANTHROPIC_API_KEY`. Photos live in the sibling
    [family-recipes-images](https://github.com/rbrock44/family-recipes-images) repo, linked by `link`

## Architecture

- `MainComponent` picks the view — `ListsComponent`, `HomeComponent`, or `RecipeComponent` — from `RecipeService`
  state. The routes in `app.routes.ts` only decide which URLs are valid; all children share one parent so
  `MainComponent` stays alive. View changes move the URL with `Location`, tagging history entries with
  `RecipeHistoryState`
- URLs: `/<id>/<slug>` for a recipe (`recipePath`, `recipeSlug` in `utils/recipe-url.util.ts`), `/lists`, `/` home.
  A bare `/<id>` is client-rendered and fixed up once recipes load. Old `/?recipe=<id>` links are redirected by
  `redirectLegacyRecipe`
- Prerendering: `app.routes.server.ts` lists every recipe from `readRecipeIndex()`. `SeoTitleStrategy` and
  `SeoService` set title, description, Open Graph and canonical tags, using the `RECIPE_INDEX` token on the server
- `RecipeService` holds nearly all app state (search, selected recipe, favorites, lists, expanded panels).
  `RecipeReaderService` does the fetch and every `localStorage` read/write, all keyed `family-recipe-*`
- Share links (favorites, lists) are Unicode-safe base64 JSON from `encodeSharePayload` in `models/list-share.ts`.
  `mergeFavorites` and `ingredient-aggregator.ts` (combines list ingredients scaled by batches) are pure functions
- Components in `src/app/components/`: `recipe-table`, `header`, `command-palette` (Ctrl K jump), `cook-mode`
  (full-screen overlay on its own history entry; `splitSteps` in `utils/instruction-steps.util.ts` breaks
  instructions into steps, `WakeLockService` keeps the screen on), `fraction`,
  `dry-conversion` / `liquid-conversion`, and the `about-dialog` / `add-to-list-dialog` Material dialogs

## Conventions

- Code that runs during prerendering must not touch `window`, `document` or `localStorage` unguarded. Go through
  `RecipeReaderService.readStorage` / `writeStorage` (they swallow storage errors) or check `isPlatformBrowser`
- Zone-based change detection (`provideZoneChangeDetection`); new component state can still be signals, as in
  `command-palette`
- Constants are `UPPER_SNAKE` exports in `constants/constants.ts`
- Pure logic goes in `models/` or `utils/` with a spec beside it; that is where most unit tests are
- Specs sit next to their source as `*.spec.ts`; DOM assertion helpers are in `constants/expectations.ts`
- Never edit `src/assets/recipes.json` by hand — edit the numbered files and recombine
- Tests run in jsdom, not a browser. `src/test-setup.ts` stubs `matchMedia`, `clipboard` and `ResizeObserver` and
  restores spies after each test; `src/test-providers.ts` gives every spec a testing HTTP backend. `vi.spyOn`
  calls through unless you add `.mockImplementation`
