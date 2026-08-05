import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CustomIngredient } from 'src/app/models/custom-ingredient.interface';
import { formatAmount } from 'src/app/models/decimal.enum';
import {
  AggregatedIngredient,
  aggregateIngredients,
} from 'src/app/models/ingredient-aggregator';
import { encodeSharedList } from 'src/app/models/list-share';
import { Recipe } from 'src/app/models/recipe.interface';
import { RecipeList } from 'src/app/models/recipe-list.interface';
import { RecipeService } from 'src/app/services/recipe.service';

interface ListRecipeRow {
  recipe: Recipe;
  batches: number;
}

interface ListView {
  list: RecipeList;
  expanded: boolean;
  renaming: boolean;
  justShared: boolean;
  nameControl: FormControl;
  rows: ListRecipeRow[];
  ingredients: AggregatedIngredient[];
  checkedIngredients: Set<string>;
  customIngredients: CustomIngredient[];
  addingCustomIngredient: boolean;
  customAmountControl: FormControl;
  customNameControl: FormControl;
  editingCustomIngredientId: string | null;
  editCustomAmountControl: FormControl;
  editCustomNameControl: FormControl;
}

@Component({
  selector: 'app-lists',
  templateUrl: './lists.component.html',
  styleUrls: ['./lists.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class ListsComponent implements OnInit {
  views: ListView[] = [];
  loading: boolean = true;

  constructor(public service: RecipeService) {}

  ngOnInit(): void {
    const lists = this.service.readLists();

    if (lists.length === 0) {
      this.loading = false;
      return;
    }

    Promise.all(lists.map((list) => this.buildView(list))).then((views) => {
      this.views = views;
      this.loading = false;
    });
  }

  toggleExpanded(view: ListView): void {
    view.expanded = !view.expanded;
    this.service.setListExpanded(view.list.id, view.expanded);
  }

  startRename(view: ListView): void {
    view.nameControl.setValue(view.list.name);
    view.renaming = true;
  }

  confirmRename(view: ListView): void {
    const name = (view.nameControl.value || '').trim();

    if (!name) {
      return;
    }

    this.service.renameList(view.list.id, name);
    view.list.name = name;
    view.renaming = false;
  }

  cancelRename(view: ListView): void {
    view.renaming = false;
  }

  deleteList(view: ListView): void {
    const confirmed = window.confirm(
      `Delete "${view.list.name}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    this.service.deleteList(view.list.id);
    this.views = this.views.filter((it) => it !== view);
  }

  updateBatches(view: ListView, row: ListRecipeRow, rawValue: string): void {
    const batches = Math.max(+rawValue || 1, 1);

    row.batches = batches;
    this.service.setListRecipeBatches(
      view.list.id,
      row.recipe.filename,
      batches,
    );

    this.refreshIngredients(view);
  }

  removeRecipe(view: ListView, row: ListRecipeRow): void {
    this.service.removeFromList(view.list.id, row.recipe.filename);
    view.rows = view.rows.filter((it) => it !== row);

    this.refreshIngredients(view);
  }

  shareList(view: ListView): void {
    const encoded = encodeSharedList({
      name: view.list.name,
      recipes: view.rows.map((row) => ({
        filename: row.recipe.filename,
        batches: row.batches,
      })),
    });

    const url = new URL(location.href);
    url.search = '';
    url.searchParams.set('sharedList', encoded);
    const shareUrl = url.toString();

    navigator.clipboard.writeText(shareUrl).then(
      () => {
        view.justShared = true;
        setTimeout(() => {
          view.justShared = false;
        }, 2000);
      },
      () => {
        window.alert(`Copy this link to share the list:\n\n${shareUrl}`);
      },
    );
  }

  openRecipe(view: ListView, recipe: Recipe): void {
    this.service.returnScrollY = window.scrollY;
    this.service.useFavoritesList = false;
    this.service.searchList = view.rows.map((row) => row.recipe.filename);
    this.service.activeListId = view.list.id;
    this.service.selectRecipe(recipe);
    this.service.addToRecent(recipe.filename);
    this.service.showLists = false;
    this.service.openedFromLists = true;
  }

  toggleIngredientChecked(
    view: ListView,
    ingredient: AggregatedIngredient,
  ): void {
    if (view.checkedIngredients.has(ingredient.key)) {
      view.checkedIngredients.delete(ingredient.key);
    } else {
      view.checkedIngredients.add(ingredient.key);
    }

    this.service.setCheckedIngredients(
      view.list.id,
      Array.from(view.checkedIngredients),
    );
  }

  startAddCustomIngredient(view: ListView): void {
    view.editingCustomIngredientId = null;
    view.customAmountControl.setValue('');
    view.customNameControl.setValue('');
    view.addingCustomIngredient = true;
  }

  cancelAddCustomIngredient(view: ListView): void {
    view.addingCustomIngredient = false;
  }

  confirmAddCustomIngredient(view: ListView): void {
    const name = (view.customNameControl.value || '').trim();
    const amount = (view.customAmountControl.value || '').trim();

    if (!name) {
      return;
    }

    const ingredient: CustomIngredient = {
      id: crypto.randomUUID(),
      name,
      amount,
    };

    view.customIngredients = [...view.customIngredients, ingredient];
    this.service.addCustomIngredient(view.list.id, ingredient);
    view.addingCustomIngredient = false;
  }

  removeCustomIngredient(view: ListView, ingredient: CustomIngredient): void {
    view.customIngredients = view.customIngredients.filter(
      (it) => it !== ingredient,
    );
    this.service.removeCustomIngredient(view.list.id, ingredient.id);

    view.checkedIngredients.delete(this.customIngredientKey(ingredient));
    this.service.setCheckedIngredients(
      view.list.id,
      Array.from(view.checkedIngredients),
    );
  }

  startEditCustomIngredient(view: ListView, ingredient: CustomIngredient): void {
    view.addingCustomIngredient = false;
    view.editCustomAmountControl.setValue(ingredient.amount);
    view.editCustomNameControl.setValue(ingredient.name);
    view.editingCustomIngredientId = ingredient.id;
  }

  cancelEditCustomIngredient(view: ListView): void {
    view.editingCustomIngredientId = null;
  }

  confirmEditCustomIngredient(
    view: ListView,
    ingredient: CustomIngredient,
  ): void {
    const name = (view.editCustomNameControl.value || '').trim();
    const amount = (view.editCustomAmountControl.value || '').trim();

    if (!name) {
      return;
    }

    const updated: CustomIngredient = { ...ingredient, name, amount };

    view.customIngredients = view.customIngredients.map((it) =>
      it.id === ingredient.id ? updated : it,
    );
    this.service.updateCustomIngredient(view.list.id, updated);
    view.editingCustomIngredientId = null;
  }

  toggleCustomIngredientChecked(
    view: ListView,
    ingredient: CustomIngredient,
  ): void {
    const key = this.customIngredientKey(ingredient);

    if (view.checkedIngredients.has(key)) {
      view.checkedIngredients.delete(key);
    } else {
      view.checkedIngredients.add(key);
    }

    this.service.setCheckedIngredients(
      view.list.id,
      Array.from(view.checkedIngredients),
    );
  }

  customIngredientKey(ingredient: CustomIngredient): string {
    return `custom:${ingredient.id}`;
  }

  getIngredientDisplay(ingredient: AggregatedIngredient): string {
    return formatAmount(ingredient.amount);
  }

  hasFraction(value: string): boolean {
    return value.indexOf('/') > 0;
  }

  // Recipes are almost always already in memory (same reasoning as
  // HomeComponent's favorites/recent loading), but a list can reference one
  // that hasn't loaded yet - falls back to a direct fetch in that case
  // rather than silently dropping it from the list.
  private async buildView(list: RecipeList): Promise<ListView> {
    const resolved = await Promise.all(
      list.recipes.map(async (entry) => {
        let recipe = this.service.findRecipe(entry.filename);

        if (!recipe) {
          try {
            const contents = await this.service.firstValueFrom(
              entry.filename,
            );
            recipe = this.service.convertRecipe(contents);
            recipe.filename = entry.filename;
          } catch {
            return undefined;
          }
        }

        return { recipe, batches: entry.batches } as ListRecipeRow;
      }),
    );

    const rows = resolved.filter((it): it is ListRecipeRow => !!it);

    return {
      list,
      expanded: this.service.expandedListIds.has(list.id),
      renaming: false,
      justShared: false,
      nameControl: new FormControl(list.name),
      rows,
      ingredients: this.buildIngredients(rows),
      checkedIngredients: new Set(
        this.service.readCheckedIngredients(list.id),
      ),
      customIngredients: list.customIngredients ?? [],
      addingCustomIngredient: false,
      customAmountControl: new FormControl(''),
      customNameControl: new FormControl(''),
      editingCustomIngredientId: null,
      editCustomAmountControl: new FormControl(''),
      editCustomNameControl: new FormControl(''),
    };
  }

  private refreshIngredients(view: ListView): void {
    view.ingredients = this.buildIngredients(view.rows);
  }

  private buildIngredients(rows: ListRecipeRow[]): AggregatedIngredient[] {
    return aggregateIngredients(
      rows.map((row) => ({ recipe: row.recipe, batches: row.batches })),
    );
  }
}
