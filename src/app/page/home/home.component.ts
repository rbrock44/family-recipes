import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CATEGORIES, getCategory } from 'src/app/models/category.enum';
import { Recipe } from '../../models/recipe.interface';
import { RecipeService } from '../../services/recipe.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-home',
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
    public service: RecipeService,
    private route: ActivatedRoute,
    private location: Location,
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

    const interval = setInterval(() => {
      const result = this.service.isFullyLoaded();
      if (result === true) {
        clearInterval(interval);

        const queryParams = new URLSearchParams(window.location.search);
        const searchParam = queryParams.get('search');
        const hasSearch = `${window.location.search}`.indexOf('search=') >= 0
        const categoryParam = queryParams.get('category');
        const familyParam = queryParams.get('hooperFamily');
        const recipeParam = queryParams.get('recipe');

        if (searchParam) {
          this.searchControl.setValue(searchParam);
        }

        if (categoryParam) {
          this.categoryControl.setValue(categoryParam);
        }

        if (familyParam) {
          this.familyControl.setValue(familyParam);
        }

        if (hasSearch || categoryParam || familyParam) {
          this.search(this.searchControl.value);
          this.service.searchList = this.dataSource.data.map(item => item.filename);
        }

        if (recipeParam) {
          this.service.readRecipe(recipeParam);
        }

      }
    }, 250); // check every 0.25 seconds
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

    this.location.replaceState(this.buildUrl(value, this.categoryControl.value, this.familyControl.value));
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

  private buildUrl(search: string, category: number, hooperFamily: boolean): string {
    const queryParams = new URLSearchParams();
    queryParams.set('search', search);

    if (category !== 0) {
      queryParams.set('category', category.toString());
    }

    if (hooperFamily) {
      queryParams.set('hooperFamily', hooperFamily ? 'true' : 'false');
    }

    const recipeParam = this.route.snapshot.queryParamMap.get('recipe');
    if (recipeParam) {
      queryParams.set('recipe', recipeParam);
    }

    const end = queryParams.toString();
    if (end !== '') {
      return `${location.pathname}?${queryParams.toString()}`;
    } else {
      return location.pathname;
    }
  }
}
