import { Component, Input } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { REGEX_TO_HIGHLIGHT } from 'src/app/constants/constants';
import { getDecimal } from 'src/app/models/decimal.enum';
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
  decimalControl: FormControl = new FormControl(false);

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
    let display = '';
    const newAmount = this.timesBatch(ingredient.amount)
    if (newAmount.length > 0) {
      const decimalValue = +newAmount % 1;

      if (decimalValue > 0) {
        const fraction = getDecimal(decimalValue);
        display = `${newAmount.substring(0, newAmount.indexOf('.'))} ${fraction}`
      } else {
        display = newAmount
      }
    } else {
      display = newAmount;
    }
    
    return display;
  }

  getIngredientDisplayOld(ingredient: Ingredient): string {
    return `${this.timesBatch(ingredient.amount)} ${ingredient.name}`
  }

  hasFraction(value: string): boolean {
    const index = value.indexOf('/');
    return index > 0;
  }

  getTitle(ingredient: Ingredient): string {
    return this.regexMatch(ingredient, 'Possible conversion detected');
  }

  private regexMatch(ingredient: Ingredient, matchValue: string): string {
    let value = '';
    // this uses the old decimal display of ingredient because that's what the regex was made to handle.... don't feel like updating
    let display: string = this.getIngredientDisplayOld(ingredient);
    REGEX_TO_HIGHLIGHT.forEach(regex => {
      if (display.search(regex) > -1) {
        value = matchValue;
      }
    });

    return value;
  }
}
