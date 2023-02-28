import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DropdownOption } from '../../models/dropdown-option.model';
import { Recipe } from '../../models/recipe.interface';
import { RecipeService } from '../../services/recipe.service';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { RecipeModel } from '../../models/recipe.model';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { getCategory } from 'src/app/models/category.enum';
import { MatSort } from '@angular/material/sort';
import { CATEGORIES } from 'src/app/constants/constants';

@Component({
  selector: 'app-root',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  title = 'family-recipes';
  panelOpenState = false;
  searchControl: FormControl = new FormControl('');
  categoryControl: FormControl = new FormControl(0);
  familyControl: FormControl = new FormControl(false);

  dataSource = new MatTableDataSource<Recipe>();
  displayColumns: string[] = ['name', 'author', 'category', 'filename'];

  // @ts-ignore
  @ViewChild(MatSort) sort: MatSort;

  categories = CATEGORIES;

  constructor(
    private router: Router,
    private service: RecipeService
  ) { }

  ngOnInit(): void {
    this.dataSource.sort = this.sort;

    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(value => {
      this.search(value);
    });

    this.familyControl.valueChanges.pipe(
      debounceTime(100),
      distinctUntilChanged()
    ).subscribe(() => {
      this.search();
    });
  }

  click(recipe: Recipe): void {
    this.router.navigateByUrl(`/recipe/${recipe.filename}`).then();
  }

  search(value: string = this.searchControl.value): void {
    this.dataSource.data = this.service.search(
      value,
      this.categoryControl.value,
      this.familyControl.value
    );
  }

  getCategory(categoryNumber: number): string {
    return getCategory(categoryNumber);
  }

  sortData(): void {
    switch (this.sort.direction) {
      case 'asc':
        this.sortTable(this.sort.active)
        this.sort.direction = 'asc';
        break;
      case 'desc':
        this.sortTable(this.sort.active, false)
        this.sort.direction = 'desc';
        break;
      default:
        this.sortTable("filename")
        this.sort.direction = '';
    }
  }

  private sortTable(column: string, asc: boolean = true) {
    this.dataSource.data = this.dataSource.data.sort((a: Recipe, b: Recipe) => {
      let value1 = RecipeModel.getValue(column, a);
      let value2 = RecipeModel.getValue(column, b);
      if (value1 > value2) {
        return asc ? 1 : -1
      } else if (value1 < value2) {
        return asc ? -1 : 1
      } else {
        return 0
      }
    });
  }

}
