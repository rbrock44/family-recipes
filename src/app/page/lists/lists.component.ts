import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormControl } from '@angular/forms';
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

    if (view.expanded) {
      this.service.expandedListIds.add(view.list.id);
    } else {
      this.service.expandedListIds.delete(view.list.id);
    }
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

  openRecipe(recipe: Recipe): void {
    this.service.returnScrollY = window.scrollY;
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
