import {Component} from '@angular/core';
import {FormControl} from '@angular/forms';
import {DropdownOption} from '../../models/dropdown-option.model';
import {Recipe} from '../../models/recipe.interface';
import {RecipeService} from '../../services/recipe.service';
import {debounceTime, distinctUntilChanged} from 'rxjs';

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
  results: Recipe[] = []

  categories = [
    new DropdownOption('', 0),
    new DropdownOption('Appetizers, Relishes & Pickles', 1,),
    new DropdownOption('Soups, Salads & Sauces', 2,),
    new DropdownOption('Meats & Main Dishes', 3,),
    new DropdownOption('Vegetables', 4,),
    new DropdownOption('Breads, Rolls & Pastries', 5,),
    new DropdownOption('Cakes, Cookies & Desserts', 6)
  ]

  constructor(private service: RecipeService) {
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(value => {

    })
  }
}
