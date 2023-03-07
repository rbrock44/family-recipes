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
  favoritesDataSource = new MatTableDataSource<Recipe>();

  categories = CATEGORIES;

  constructor(
    private service: RecipeService
  ) { }

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300)
    ).subscribe(value => {
      this.search(value);
    });

    this.familyControl.valueChanges.pipe(
      debounceTime(100),
      distinctUntilChanged()
    ).subscribe(() => {
      this.search();
    });

    this.loadFavorites();
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

  loadFavorites(): void {
    this.service.readFavorites().forEach(filename => {
      this.service.firstValueFrom(filename).then(contents => {
        let recipe = this.service.convertRecipe(contents)
        recipe.filename = filename;
        this.favoritesDataSource.data = this.favoritesDataSource.data.concat(recipe)
      });
    });
  }
}
