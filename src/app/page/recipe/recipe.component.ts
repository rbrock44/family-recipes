import { Component, Input } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { REGEX_TO_HIGHLIGHT } from 'src/app/constants/constants';
import { Ingredient } from 'src/app/models/ingredient.interface';
import { RecipeService } from 'src/app/services/recipe.service';
import { Recipe } from '../../models/recipe.interface';
import { RecipeModel } from '../../models/recipe.model';

@Component({
  selector: 'app-recipe',
  templateUrl: './recipe.component.html',
  styleUrls: ['./recipe.component.scss']
})
export class RecipeComponent {
  @Input() recipe: Recipe = new RecipeModel();
  showLiquid: boolean = false;
  showDry: boolean = false;
  batchControl: FormControl = new FormControl(1, [Validators.min(1), Validators.pattern("^[1-9][0-9]*$")]);

  constructor(
    private service: RecipeService
  ) {
  }

  timesBatch(value: any): string {
    const newValue: string = value == undefined ? '0' : value.toString();
    const total = this.batchControl.value * +newValue

    return total == 0 ? '' : total.toString()
  }

  halfIngredients(firstHalf: boolean = true): Ingredient[] {
    const half = Math.ceil(this.recipe.ingredients.length / 2);

    if (firstHalf) {
      return this.recipe.ingredients.slice(0, half)
    } else {
      return this.recipe.ingredients.slice(half)
    }
  }

  close(isLiquid: boolean = true): void {
    if (isLiquid) {
      this.showLiquid = false;
    } else {
      this.showDry = false;
    }
  }

  open(isLiquid: boolean = true): void {
    if (isLiquid) {
      this.showLiquid = true;
    } else {
      this.showDry = true;
    }
  }

  isFavorite(): boolean {
    return this.service.readFavorites().indexOf(this.recipe.filename) > -1;
  }

  favorite(): void {
    this.service.addToFavorites(this.recipe.filename);
  }

  unfavorite(): void {
    this.service.removeFromFavorites(this.recipe.filename);
  }

  shouldUnderline(ingredient: Ingredient): string {
    return this.regexMatch(ingredient, 'underline');
  }

  getIngredientDisplay(ingredient: Ingredient): string {
    return `${this.timesBatch(ingredient.amount)} ${ingredient.name}`
  }

  getTitle(ingredient: Ingredient): string {
      return this.regexMatch(ingredient, 'Possible conversion detected');
  }

  private regexMatch(ingredient: Ingredient, matchValue: string): string {
    let value = '';
    let display: string = this.getIngredientDisplay(ingredient);
    REGEX_TO_HIGHLIGHT.forEach(regex => {
      if (display.search(regex) > -1) {
        value = matchValue;  
      }
    });

    return value;
  }
}
