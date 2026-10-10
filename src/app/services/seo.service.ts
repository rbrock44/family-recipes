import { DOCUMENT, Injectable, InjectionToken, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { isListsPath, parseRecipeId, recipePath } from '../utils/recipe-url.util';

export const SITE_URL = 'https://family-recipes.ryan-brock.com';
const SITE_TITLE = 'Family Recipes - Searchable Family Recipe Collection';
const SITE_DESCRIPTION =
  "Browse and search our family's recipe collection by name, author, or category, with adjustable batch sizes and favorites.";

export interface RecipeMeta {
  filename: string;
  name: string;
  author: string;
}

/** Every recipe's name and author by filename. Only provided during prerendering. */
export const RECIPE_INDEX = new InjectionToken<ReadonlyMap<string, RecipeMeta>>('RECIPE_INDEX');

/** Sets the title and every description, social, canonical, and robots tag for a path. */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  update(path: string, recipe?: RecipeMeta): void {
    // A recipe path whose recipe hasn't loaded yet keeps the current tags rather than flashing home's.
    if (parseRecipeId(path) && !recipe) {
      return;
    }

    let title = SITE_TITLE;
    let description = SITE_DESCRIPTION;
    let pagePath = '';
    let noindex = false;

    if (recipe) {
      title = `${recipe.name} - Family Recipes`;
      description = `${recipe.name} by ${recipe.author}, from our searchable family recipe collection.`;
      pagePath = recipePath(recipe.filename, recipe.name);
    } else if (isListsPath(path)) {
      title = 'Lists - Family Recipes';
      pagePath = '/lists';
      // Lists live in this browser's storage, so the page has nothing to index.
      noindex = true;
    }

    // GitHub Pages serves each prerendered page from its folder, so the trailing slash is the real URL.
    const url = `${SITE_URL}${pagePath}/`;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: noindex ? 'noindex' : 'index, follow' });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.document.querySelector('link[rel="canonical"]')?.setAttribute('href', url);
  }
}

/**
 * Bakes each page's tags in during prerendering. In the browser RecipeService keeps them in
 * sync instead, since most view changes move the URL through Location rather than the router.
 */
@Injectable({ providedIn: 'root' })
export class SeoTitleStrategy extends TitleStrategy {
  private readonly seo = inject(SeoService);
  private readonly index = inject(RECIPE_INDEX, { optional: true });

  override updateTitle(snapshot: RouterStateSnapshot): void {
    if (!this.index) {
      return;
    }

    const id = parseRecipeId(snapshot.url);
    this.seo.update(snapshot.url, id ? this.index.get(id) : undefined);
  }
}
