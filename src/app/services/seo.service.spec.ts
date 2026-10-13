import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot } from '@angular/router';
import { RECIPE_INDEX, RecipeMeta, SeoService, SeoTitleStrategy, SITE_URL } from './seo.service';

const PIE: RecipeMeta = { filename: '0042', name: 'Apple Pie', author: 'Mary Hooper' };

describe('SeoService', () => {
  let seo: SeoService;
  let title: Title;
  let meta: Meta;
  let canonical: HTMLLinkElement;

  const tag = (selector: string) => meta.getTag(selector)?.content;

  beforeEach(() => {
    seo = TestBed.inject(SeoService);
    title = TestBed.inject(Title);
    meta = TestBed.inject(Meta);

    const document = TestBed.inject(DOCUMENT);
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  });

  afterEach(() => canonical.remove());

  it('describes the home page', () => {
    seo.update('/');

    expect(title.getTitle()).toBe('Family Recipes - Searchable Family Recipe Collection');
    expect(tag('name="robots"')).toBe('index, follow');
    expect(tag('property="og:url"')).toBe(`${SITE_URL}/`);
    expect(canonical.getAttribute('href')).toBe(`${SITE_URL}/`);
  });

  it('describes a recipe by name and author', () => {
    seo.update('/0042/apple-pie', PIE);

    expect(title.getTitle()).toBe('Apple Pie - Family Recipes');
    expect(tag('name="description"')).toContain('Apple Pie by Mary Hooper');
    expect(tag('name="twitter:title"')).toBe('Apple Pie - Family Recipes');
    expect(canonical.getAttribute('href')).toBe(`${SITE_URL}/0042/apple-pie/`);
  });

  it('keeps the lists page out of search results', () => {
    seo.update('/lists');

    expect(title.getTitle()).toBe('Lists - Family Recipes');
    expect(tag('name="robots"')).toBe('noindex');
    expect(canonical.getAttribute('href')).toBe(`${SITE_URL}/lists/`);
  });

  it('leaves the tags alone for a recipe that has not loaded yet', () => {
    seo.update('/0042/apple-pie', PIE);
    seo.update('/0007');

    expect(title.getTitle()).toBe('Apple Pie - Family Recipes');
  });
});

describe('SeoTitleStrategy', () => {
  const snapshot = (url: string) => ({ url }) as RouterStateSnapshot;

  it('fills recipe tags from the index during prerendering', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: RECIPE_INDEX, useValue: new Map([[PIE.filename, PIE]]) }],
    });
    const update = vi.spyOn(TestBed.inject(SeoService), 'update');

    TestBed.inject(SeoTitleStrategy).updateTitle(snapshot('/42/apple-pie'));

    expect(update).toHaveBeenCalledWith('/42/apple-pie', PIE);
  });

  it('does nothing in the browser, where there is no index', () => {
    const update = vi.spyOn(TestBed.inject(SeoService), 'update');

    TestBed.inject(SeoTitleStrategy).updateTitle(snapshot('/'));

    expect(update).not.toHaveBeenCalled();
  });
});
