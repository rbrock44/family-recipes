import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
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
export class RecipeTableComponent implements OnInit {
  @Input() dataSource = new MatTableDataSource<Recipe>();
  @Input() removeColumns: boolean = false;
  @Input() isFavoritesList: boolean = false;
  @Input() showUnfavorite: boolean = false;
  @Input() showRemoveRecent: boolean = false;
  displayColumns: string[] = ['name', 'author', 'category', 'filename'];

  // @ts-ignore
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private location: Location,
    private service: RecipeService,
  ) {}

  ngOnInit(): void {
    if (this.removeColumns) {
      this.displayColumns = ['name', 'author'];
    }

    if (this.showUnfavorite || this.showRemoveRecent) {
      this.displayColumns = [...this.displayColumns, 'actions'];
    }

    this.dataSource.sort = this.sort;
  }

  click(recipe: Recipe, event?: Event): void {
    if (
      event &&
      (event.target as HTMLElement).closest('.mat-column-actions')
    ) {
      return;
    }

    this.service.useFavoritesList = this.isFavoritesList;
    var filename = recipe.filename != null ? recipe.filename.toString() : '001';
    recipe.filename = filename;
    this.service.searchList = this.dataSource.data.map((item) => item.filename);
    this.service.selectRecipe(recipe);
    this.service.addToRecent(filename);

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
