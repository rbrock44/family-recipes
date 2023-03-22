import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CATEGORIES } from 'src/app/constants/constants';
import { getCategory } from 'src/app/models/category.enum';
import { Recipe } from '../../models/recipe.interface';
import { RecipeService } from '../../services/recipe.service';

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
    // document.querySelectorAll('[type=search]').forEach((element) => {
    //   this.blurKeyboard(element);
    // });
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

  blurKeyboard(element: any) {
    element.addEventListener('keyup', (keyboardEvent: any) => {
      if (keyboardEvent.code === 'Enter') {
        element.blur();
      }
    });
  };

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
