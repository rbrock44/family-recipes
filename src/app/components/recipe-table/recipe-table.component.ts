import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { getCategory } from 'src/app/models/category.enum';
import { Recipe } from '../../models/recipe.interface';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-recipe-table',
  templateUrl: './recipe-table.component.html',
  styleUrls: ['./recipe-table.component.scss']
})
export class RecipeTableComponent implements OnInit {
  @Input() dataSource = new MatTableDataSource<Recipe>();
  @Input() removeColumns: boolean = false;
  displayColumns: string[] = ['name', 'author', 'category', 'filename'];

  // @ts-ignore
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private service: RecipeService
  ) { }

  ngOnInit(): void {
    if (this.removeColumns) {
      this.displayColumns = ['name', 'author']
    }

    this.dataSource.sort = this.sort;
  }

  click(recipe: Recipe): void {
    this.service.useFavoritesList = this.removeColumns;
    var filename = recipe.filename != null ? recipe.filename.toString() : '001';
    this.service.searchList = this.dataSource.data.map(item => item.filename);
    this.service.readRecipe(filename);
  }

  getCategory(categoryNumber: number): string {
    return getCategory(categoryNumber);
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
}
