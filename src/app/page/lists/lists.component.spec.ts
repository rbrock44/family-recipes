import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import { ListsComponent } from './lists.component';
import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../models/recipe.interface';
import { RecipeList } from '../../models/recipe-list.interface';

function recipe(filename: string, ingredientName: string): Recipe {
  return {
    name: `Recipe ${filename}`,
    author: 'a',
    category: 0,
    instructions: '',
    filename,
    ingredients: [{ name: ingredientName, amount: 1 }],
    yield: { name: 'servings', amount: 1 },
  };
}

describe('ListsComponent', () => {
  let fixture: ComponentFixture<ListsComponent>;
  let component: ListsComponent;
  let service: RecipeService;

  const recipes = [recipe('0001', 'cups flour'), recipe('0002', 'cups flour')];
  let list: RecipeList;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, RouterTestingModule, ListsComponent],
      providers: [
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    list = {
      id: 'list-1',
      name: 'Weekend',
      recipes: [
        { filename: '0001', batches: 1 },
        { filename: '0002', batches: 2 },
      ],
    };

    service = TestBed.inject(RecipeService);
    vi.spyOn(service, 'readLists').mockImplementation(() => [list]);
    vi.spyOn(service, 'findRecipe').mockImplementation((filename: string) =>
      recipes.find((it) => it.filename === filename),
    );

    fixture = TestBed.createComponent(ListsComponent);
    component = fixture.componentInstance;
  });

  async function load(): Promise<void> {
    component.ngOnInit();
    // ngOnInit runs outside the zone, so whenStable alone would not wait for the views.
    await new Promise(resolve => setTimeout(resolve));
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('stops loading with no lists', () => {
    vi.mocked(service.readLists).mockReturnValue([]);
    component.ngOnInit();

    expect(component.loading).toBe(false);
    expect(component.views).toEqual([]);
  });

  it('builds a view per list with combined ingredients', async () => {
    await load();

    expect(component.loading).toBe(false);
    expect(component.views.length).toBe(1);
    expect(component.views[0].rows.length).toBe(2);
    expect(component.views[0].ingredients.length).toBe(1);
    expect(component.views[0].ingredients[0].amount).toBe(3);
  });

  it('updates batches and recombines ingredients', async () => {
    const setBatches = vi.spyOn(service, 'setListRecipeBatches').mockImplementation(() => {});
    await load();
    const view = component.views[0];

    component.updateBatches(view, view.rows[0], '4');

    expect(setBatches).toHaveBeenCalledWith('list-1', '0001', 4);
    expect(view.ingredients[0].amount).toBe(6);
  });

  it('clamps batches to at least 1', async () => {
    vi.spyOn(service, 'setListRecipeBatches').mockImplementation(() => {});
    await load();
    const view = component.views[0];

    component.updateBatches(view, view.rows[0], '0');

    expect(view.rows[0].batches).toBe(1);
  });

  it('removes a recipe from the list', async () => {
    const remove = vi.spyOn(service, 'removeFromList').mockImplementation(() => {});
    await load();
    const view = component.views[0];

    component.removeRecipe(view, view.rows[1]);

    expect(remove).toHaveBeenCalledWith('list-1', '0002');
    expect(view.rows.length).toBe(1);
    expect(view.ingredients[0].amount).toBe(1);
  });

  it('renames with a trimmed name and ignores blanks', async () => {
    const rename = vi.spyOn(service, 'renameList').mockImplementation(() => {});
    await load();
    const view = component.views[0];

    component.startRename(view);
    view.nameControl.setValue('   ');
    component.confirmRename(view);
    expect(rename).not.toHaveBeenCalled();
    expect(view.renaming).toBe(true);

    view.nameControl.setValue('  Holiday  ');
    component.confirmRename(view);
    expect(rename).toHaveBeenCalledWith('list-1', 'Holiday');
    expect(view.list.name).toBe('Holiday');
    expect(view.renaming).toBe(false);
  });

  it('deletes only when confirmed', async () => {
    const remove = vi.spyOn(service, 'deleteList').mockImplementation(() => {});
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await load();
    const view = component.views[0];

    component.deleteList(view);
    expect(remove).not.toHaveBeenCalled();
    expect(component.views.length).toBe(1);

    confirm.mockReturnValue(true);
    component.deleteList(view);
    expect(remove).toHaveBeenCalledWith('list-1');
    expect(component.views.length).toBe(0);
  });

  it('toggles ingredient checks and persists them', async () => {
    const setChecked = vi.spyOn(service, 'setCheckedIngredients').mockImplementation(() => {});
    await load();
    const view = component.views[0];
    const ingredient = view.ingredients[0];

    component.toggleIngredientChecked(view, ingredient);
    expect(setChecked).toHaveBeenCalledWith('list-1', [ingredient.key]);

    component.toggleIngredientChecked(view, ingredient);
    expect(setChecked).toHaveBeenCalledWith('list-1', []);
  });

  it('adds a custom ingredient only with a name', async () => {
    const add = vi.spyOn(service, 'addCustomIngredient').mockImplementation(() => {});
    await load();
    const view = component.views[0];

    component.startAddCustomIngredient(view);
    component.confirmAddCustomIngredient(view);
    expect(add).not.toHaveBeenCalled();

    view.customAmountControl.setValue(' 2 ');
    view.customNameControl.setValue(' paper towels ');
    component.confirmAddCustomIngredient(view);

    expect(add).toHaveBeenCalled();
    expect(view.customIngredients.length).toBe(1);
    expect(view.customIngredients[0].name).toBe('paper towels');
    expect(view.customIngredients[0].amount).toBe('2');
    expect(view.addingCustomIngredient).toBe(false);
  });

  it('copies a share link pointing at home', async () => {
    const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    await load();
    const view = component.views[0];

    component.shareList(view);

    const url = new URL(write.mock.lastCall![0] as string);
    expect(url.pathname).toBe('/');
    expect(url.searchParams.get('sharedList')).toBeTruthy();
  });
});
