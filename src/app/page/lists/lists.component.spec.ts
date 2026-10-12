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
    spyOn(service, 'readLists').and.callFake(() => [list]);
    spyOn(service, 'findRecipe').and.callFake((filename: string) =>
      recipes.find((it) => it.filename === filename),
    );

    fixture = TestBed.createComponent(ListsComponent);
    component = fixture.componentInstance;
  });

  async function load(): Promise<void> {
    component.ngOnInit();
    await fixture.whenStable();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('stops loading with no lists', () => {
    (service.readLists as jasmine.Spy).and.returnValue([]);
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(component.views).toEqual([]);
  });

  it('builds a view per list with combined ingredients', async () => {
    await load();

    expect(component.loading).toBeFalse();
    expect(component.views.length).toBe(1);
    expect(component.views[0].rows.length).toBe(2);
    expect(component.views[0].ingredients.length).toBe(1);
    expect(component.views[0].ingredients[0].amount).toBe(3);
  });

  it('updates batches and recombines ingredients', async () => {
    const setBatches = spyOn(service, 'setListRecipeBatches');
    await load();
    const view = component.views[0];

    component.updateBatches(view, view.rows[0], '4');

    expect(setBatches).toHaveBeenCalledWith('list-1', '0001', 4);
    expect(view.ingredients[0].amount).toBe(6);
  });

  it('clamps batches to at least 1', async () => {
    spyOn(service, 'setListRecipeBatches');
    await load();
    const view = component.views[0];

    component.updateBatches(view, view.rows[0], '0');

    expect(view.rows[0].batches).toBe(1);
  });

  it('removes a recipe from the list', async () => {
    const remove = spyOn(service, 'removeFromList');
    await load();
    const view = component.views[0];

    component.removeRecipe(view, view.rows[1]);

    expect(remove).toHaveBeenCalledWith('list-1', '0002');
    expect(view.rows.length).toBe(1);
    expect(view.ingredients[0].amount).toBe(1);
  });

  it('renames with a trimmed name and ignores blanks', async () => {
    const rename = spyOn(service, 'renameList');
    await load();
    const view = component.views[0];

    component.startRename(view);
    view.nameControl.setValue('   ');
    component.confirmRename(view);
    expect(rename).not.toHaveBeenCalled();
    expect(view.renaming).toBeTrue();

    view.nameControl.setValue('  Holiday  ');
    component.confirmRename(view);
    expect(rename).toHaveBeenCalledWith('list-1', 'Holiday');
    expect(view.list.name).toBe('Holiday');
    expect(view.renaming).toBeFalse();
  });

  it('deletes only when confirmed', async () => {
    const remove = spyOn(service, 'deleteList');
    const confirm = spyOn(window, 'confirm').and.returnValue(false);
    await load();
    const view = component.views[0];

    component.deleteList(view);
    expect(remove).not.toHaveBeenCalled();
    expect(component.views.length).toBe(1);

    confirm.and.returnValue(true);
    component.deleteList(view);
    expect(remove).toHaveBeenCalledWith('list-1');
    expect(component.views.length).toBe(0);
  });

  it('toggles ingredient checks and persists them', async () => {
    const setChecked = spyOn(service, 'setCheckedIngredients');
    await load();
    const view = component.views[0];
    const ingredient = view.ingredients[0];

    component.toggleIngredientChecked(view, ingredient);
    expect(setChecked).toHaveBeenCalledWith('list-1', [ingredient.key]);

    component.toggleIngredientChecked(view, ingredient);
    expect(setChecked).toHaveBeenCalledWith('list-1', []);
  });

  it('adds a custom ingredient only with a name', async () => {
    const add = spyOn(service, 'addCustomIngredient');
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
    expect(view.addingCustomIngredient).toBeFalse();
  });

  it('copies a share link pointing at home', async () => {
    const write = spyOn(navigator.clipboard, 'writeText').and.resolveTo();
    await load();
    const view = component.views[0];

    component.shareList(view);

    const url = new URL(write.calls.mostRecent().args[0] as string);
    expect(url.pathname).toBe('/');
    expect(url.searchParams.get('sharedList')).toBeTruthy();
  });
});
