import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommandPaletteComponent } from './command-palette.component';
import { CommandPaletteService } from '../../services/command-palette.service';
import { RecipeService } from '../../services/recipe.service';
import { EMPTY_RECIPE } from '../../constants/constants';
import { Recipe } from '../../models/recipe.interface';
import type { Mocked } from 'vitest';

function recipe(filename: string, name: string, author: string, category = 6): Recipe {
  return { ...EMPTY_RECIPE, filename, name, author, category };
}

const RECIPES: Recipe[] = [
  recipe('0003', 'Sugar Cookies', 'Elaine Heuring'),
  recipe('0001', 'Apple Pie', 'Mary Hooper', 5),
  recipe('0002', 'Chocolate Chip Cookies', 'Mary Hooper'),
  recipe('0004', 'Beef Stew', 'Elaine Heuring', 3),
];

describe('CommandPaletteComponent', () => {
  let component: CommandPaletteComponent;
  let fixture: ComponentFixture<CommandPaletteComponent>;
  let palette: CommandPaletteService;
  let service: Mocked<RecipeService>;
  let recent: string[];
  let favorites: string[];

  const press = (key: string, init: KeyboardEventInit = {}) => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }));
    fixture.detectChanges();
  };

  const pressInPalette = (key: string, init: KeyboardEventInit = {}) => {
    component.onKeydown(new KeyboardEvent('keydown', { key, ...init }));
    fixture.detectChanges();
  };

  const open = () => {
    palette.open();
    fixture.detectChanges();
  };

  const element = () => fixture.nativeElement as HTMLElement;
  const titles = () => Array.from(element().querySelectorAll('.item .title')).map(t => t.textContent);
  const sectionLabels = () => component.sections().map(section => section.label);
  const activeTitle = () => element().querySelector('.item.active .title')?.textContent;

  beforeEach(async () => {
    recent = [];
    favorites = [];
    service = {
      isFullyLoaded: vi.fn(),
      allRecipes: vi.fn(),
      readRecent: vi.fn(),
      readFavorites: vi.fn(),
      selectRecipe: vi.fn(),
      addToRecent: vi.fn(),
      pushView: vi.fn(),
      buildRecipeUrl: vi.fn(),
      listsUrl: vi.fn(),
      setEmptyRecipe: vi.fn(),
      selectedRecipe: { ...EMPTY_RECIPE },
    } as unknown as Mocked<RecipeService>;
    service.isFullyLoaded.mockReturnValue(true);
    service.allRecipes.mockReturnValue(RECIPES);
    service.readRecent.mockImplementation(() => recent);
    service.readFavorites.mockImplementation(() => favorites);
    service.buildRecipeUrl.mockImplementation(filename => (filename ? `/${filename}` : '/'));
    service.listsUrl.mockReturnValue('/lists');

    await TestBed.configureTestingModule({
      imports: [CommandPaletteComponent],
      providers: [{ provide: RecipeService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(CommandPaletteComponent);
    component = fixture.componentInstance;
    palette = TestBed.inject(CommandPaletteService);
    fixture.detectChanges();
  });

  it('should render nothing while closed', () => {
    expect(element().querySelector('.palette')).toBeNull();
  });

  it('should open with Ctrl K, ⌘ K, or / and focus the search box', () => {
    press('k', { ctrlKey: true });
    expect(palette.isOpen()).toBe(true);
    expect(document.activeElement?.classList).toContain('query');

    press('k', { ctrlKey: true });
    expect(palette.isOpen()).toBe(false);

    press('K', { metaKey: true });
    expect(palette.isOpen()).toBe(true);
    palette.close();
    fixture.detectChanges();

    press('/');
    expect(palette.isOpen()).toBe(true);
  });

  it('should not hijack / while typing in a field', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }));

    expect(palette.isOpen()).toBe(false);
    input.remove();
  });

  it('should open from the floating jump button and hide it while open', () => {
    const fab = element().querySelector('[data-jump-fab]') as HTMLButtonElement;
    expect(fab.getAttribute('aria-label')).toBe('Jump to a recipe');
    expect(fab.getAttribute('aria-haspopup')).toBe('dialog');

    fab.click();
    fixture.detectChanges();

    expect(palette.isOpen()).toBe(true);
    expect(fab.classList).toContain('hidden');
  });

  it('should list recent, then pages, then all other recipes by name', () => {
    recent = ['0004'];
    open();

    expect(sectionLabels()).toEqual(['Recent', 'Pages', 'All recipes']);
    expect(titles()).toEqual([
      'Beef Stew',
      'Home',
      'Lists',
      'Apple Pie',
      'Chocolate Chip Cookies',
      'Sugar Cookies',
    ]);
  });

  it('should list favorites first and not repeat them under recent or all recipes', () => {
    favorites = ['0002'];
    recent = ['0002', '0004'];
    open();

    expect(sectionLabels()).toEqual(['Favorites', 'Recent', 'Pages', 'All recipes']);
    expect(titles()).toEqual([
      'Chocolate Chip Cookies',
      'Beef Stew',
      'Home',
      'Lists',
      'Apple Pie',
      'Sugar Cookies',
    ]);
  });

  it('should skip empty sections', () => {
    open();

    expect(sectionLabels()).toEqual(['Pages', 'All recipes']);
  });

  it('should label the dialog, listbox and groups for assistive tech', () => {
    open();

    const dialog = element().querySelector('.palette');
    expect(dialog?.getAttribute('role')).toBe('dialog');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(element().querySelector('[role="listbox"]')).toBeTruthy();
    const groups = Array.from(element().querySelectorAll('[role="group"]')).map(g => g.getAttribute('aria-label'));
    expect(groups).toEqual(['Pages', 'All recipes']);
    expect(element().querySelectorAll('[role="option"]').length).toBe(6);
    const input = element().querySelector('[role="combobox"]') as HTMLInputElement;
    expect(input.getAttribute('enterkeyhint')).toBe('go');
    expect(input.getAttribute('inputmode')).toBe('search');
  });

  it('should filter as you type and reset the highlight', () => {
    open();
    pressInPalette('ArrowDown');

    component.onQuery('cookies');
    fixture.detectChanges();

    expect(sectionLabels()).toEqual(['Results']);
    expect(titles()).toEqual(['Chocolate Chip Cookies', 'Sugar Cookies']);
    expect(component.activeIndex()).toBe(0);
  });

  it('should match author and recipe number', () => {
    open();

    component.onQuery('hooper pie');
    fixture.detectChanges();
    expect(titles()).toEqual(['Apple Pie']);

    component.onQuery('0004');
    fixture.detectChanges();
    expect(titles()).toEqual(['Beef Stew']);
  });

  it('should show an empty message when nothing matches', () => {
    open();
    component.onQuery('zzqx');
    fixture.detectChanges();

    expect(element().querySelector('.empty')?.textContent).toContain('zzqx');
  });

  it('should move the highlight with the arrow keys and wrap around', () => {
    open();
    component.onQuery('cookies');
    fixture.detectChanges();

    pressInPalette('ArrowUp');
    expect(component.activeIndex()).toBe(1);
    expect(activeTitle()).toBe('Sugar Cookies');

    pressInPalette('ArrowDown');
    expect(component.activeIndex()).toBe(0);
    expect(element().querySelector('[role="combobox"]')?.getAttribute('aria-activedescendant'))
      .toBe('palette-option-0');
  });

  it('should open the highlighted recipe on Enter and close', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    open();
    component.onQuery('sugar');
    fixture.detectChanges();

    pressInPalette('Enter');

    expect(service.selectRecipe).toHaveBeenCalledWith(RECIPES[0]);
    expect(service.addToRecent).toHaveBeenCalledWith('0003');
    expect(service.pushView).toHaveBeenCalledWith('/0003');
    expect(service.searchList).toEqual(['0003']);
    expect(palette.isOpen()).toBe(false);
  });

  it('should open a page from the list', () => {
    open();
    component.onQuery('lists');
    fixture.detectChanges();

    (element().querySelector('.item') as HTMLElement).click();

    expect(service.showLists).toBe(true);
    expect(service.pushView).toHaveBeenCalledWith('/lists', { lists: true });
    expect(palette.isOpen()).toBe(false);
  });

  it('should keep Tab on the search box', () => {
    open();
    const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });

    component.onKeydown(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('should close on Escape, a backdrop click, and Cancel', () => {
    open();
    pressInPalette('Escape');
    expect(palette.isOpen()).toBe(false);

    open();
    (element().querySelector('.backdrop') as HTMLElement).click();
    expect(palette.isOpen()).toBe(false);

    open();
    (element().querySelector('[data-palette-cancel]') as HTMLElement).click();
    expect(palette.isOpen()).toBe(false);
  });

  it('should return focus to the element that opened it', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    open();
    expect(document.activeElement?.classList).toContain('query');

    pressInPalette('Escape');
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('should reset the query and highlight when reopened', () => {
    open();
    component.onQuery('cookies');
    fixture.detectChanges();
    pressInPalette('ArrowDown');
    palette.close();
    fixture.detectChanges();

    open();
    expect(component.query()).toBe('');
    expect(component.activeIndex()).toBe(0);
    expect(activeTitle()).toBe(titles()[0]);
  });
});
