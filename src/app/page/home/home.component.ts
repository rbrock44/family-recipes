import {Component} from '@angular/core';
import {FormControl} from '@angular/forms';
import {DropdownOption} from '../../models/dropdown-option.model';
import {Recipe} from '../../models/recipe.interface';
import {RecipeService} from '../../services/recipe.service';
import {debounceTime, distinctUntilChanged} from 'rxjs';
import {RecipeModel} from '../../models/recipe.model';
import {Router} from '@angular/router';

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
  results: Recipe[] = [
    new RecipeModel({
      name: 'Example',
      author: 'Ryan',
      category: 1,
      filename: '001',
      ingredients: [
        {name: 'a', amount: 1},
        {name: 'b', amount: 2},
        {name: 'c', amount: 3}
      ],
      instructions: 'how to',
      yield: {name: 'b', amount: 12}
    })
  ]

  categories = [
    new DropdownOption('', 0),
    new DropdownOption('Appetizers, Relishes & Pickles', 1,),
    new DropdownOption('Soups, Salads & Sauces', 2,),
    new DropdownOption('Meats & Main Dishes', 3,),
    new DropdownOption('Vegetables', 4,),
    new DropdownOption('Breads, Rolls & Pastries', 5,),
    new DropdownOption('Cakes, Cookies & Desserts', 6)
  ]

  constructor(
    private router: Router,
    private service: RecipeService
  ) {
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(value => {
      this.results = this.service.search(
        value,
        this.categoryControl.value,
        this.familyControl.value
      )
    })
  }

  click(recipe: Recipe) {
    this.router.navigateByUrl(`/recipe/${recipe.filename}`).then();
  }
}
