import {
  Component,
  Input,
  OnChanges,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AddToListDialogComponent } from '../add-to-list-dialog/add-to-list-dialog.component';
import { getCategory } from 'src/app/models/category.enum';
import { Recipe } from '../../models/recipe.interface';
import { RecipeService } from '../../services/recipe.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-recipe-table',
  templateUrl: './recipe-table.component.html',
  styleUrls: ['./recipe-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class RecipeTableComponent implements OnInit, OnChanges {
  @Input() dataSource = new MatTableDataSource<Recipe>();
  @Input() removeColumns: boolean = false;
  @Input() isFavoritesList: boolean = false;
  @Input() showUnfavorite: boolean = false;
  @Input() showRemoveRecent: boolean = false;
  @Input() showAddToList: boolean = false;
  @Input() showBulkActions: boolean = false;
  displayColumns: string[] = ['name', 'author', 'category', 'filename'];

  // @ts-ignore
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private location: Location,
    public service: RecipeService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.dataSource.sort = this.sort;
  }

  ngOnChanges(): void {
    let columns = this.removeColumns
      ? ['name', 'author']
      : ['name', 'author', 'category', 'filename'];

    if (this.showUnfavorite || this.showRemoveRecent || this.showAddToList) {
      columns = [...columns, 'actions'];
    }

    this.displayColumns = columns;
  }

  click(recipe: Recipe, event?: Event): void {
    if (
      event &&
      (event.target as HTMLElement).closest('.mat-column-actions')
    ) {
      return;
    }

    if (this.showAddToList && this.service.selectMode) {
      this.service.toggleSelectedForList(recipe.filename);
      return;
    }

    this.service.useFavoritesList = this.isFavoritesList;
    var filename = recipe.filename != null ? recipe.filename.toString() : '001';
    recipe.filename = filename;
    this.service.searchList = this.dataSource.data.map((item) => item.filename);
    this.service.returnScrollY = window.scrollY;
    this.service.selectRecipe(recipe);
    this.service.addToRecent(filename);
    this.service.openedFromLists = false;

    this.location.replaceState(this.buildUrl(filename));
  }

  getCategory(categoryNumber: number): string {
    return getCategory(categoryNumber);
  }

  unfavoriteRow(recipe: Recipe, event: Event): void {
    event.stopPropagation();
    this.service.removeFromFavorites(recipe.filename);
    this.dataSource.data = this.dataSource.data.filter(
      (it) => it.filename !== recipe.filename,
    );
  }

  removeRecent(recipe: Recipe, event: Event): void {
    event.stopPropagation();
    this.service.removeFromRecent(recipe.filename);
    this.dataSource.data = this.dataSource.data.filter(
      (it) => it.filename !== recipe.filename,
    );
  }

  setSelectMode(checked: boolean): void {
    this.service.selectMode = checked;

    if (!checked) {
      this.service.clearSelectedForList();
    }
  }

  openAddToList(recipe: Recipe, event: Event): void {
    event.stopPropagation();
    this.dialog.open(AddToListDialogComponent, {
      data: { recipes: [recipe], defaultBatches: 1 },
    });
  }

  openBulkAddToList(): void {
    // Selections can come from any table showing this component (search,
    // favorites, recently visited), not just this one - resolve by filename
    // from the shared in-memory recipe list rather than this table's own
    // dataSource.
    const recipes = Array.from(this.service.selectedForList)
      .map((filename) => this.service.findRecipe(filename))
      .filter((it): it is Recipe => !!it);

    const dialogRef = this.dialog.open(AddToListDialogComponent, {
      data: { recipes, defaultBatches: 1 },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.service.clearSelectedForList();
        this.service.selectMode = false;
      }
    });
  }

  clearSelection(): void {
    this.service.clearSelectedForList();
  }

  sortData(): void {
    this.service.sortTable(this.dataSource, this.sort, !this.removeColumns);
  }

  getResultClass(): string {
    return this.getClass('results');
  }

  getResultBoxClass(): string {
    return this.getClass('results-box');
  }

  private getClass(cssClass: string): string {
    return this.removeColumns ? '' : cssClass;
  }

  private buildUrl(recipe: string | null): string {
    const queryParams = new URLSearchParams(window.location.search);

    if (recipe === null) {
      queryParams.delete('recipe');
    } else {
      queryParams.set('recipe', recipe);
    }

    return `${location.pathname}?${queryParams.toString()}`;
  }
}
