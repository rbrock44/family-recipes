import { Component, ViewChild } from '@angular/core';
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
export class HomeComponent {
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
  ) {
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
    );;
  }

  getCategory(categoryNumber: number): string {
    return getCategory(categoryNumber);
  }
}
