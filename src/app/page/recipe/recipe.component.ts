import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Ingredient } from 'src/app/models/ingredient.interface';
import { RecipeReaderService } from 'src/app/services/recipe-reader.service';
import { Recipe } from '../../models/recipe.interface';
import { RecipeModel } from '../../models/recipe.model';

@Component({
  selector: 'app-root',
  templateUrl: './recipe.component.html',
  styleUrls: ['./recipe.component.scss']
})
export class RecipeComponent {
  showLiquid: boolean = false;
  showDry: boolean = false;
  recipe: Recipe = new RecipeModel();
  batchControl: FormControl = new FormControl(1, [Validators.min(1), Validators.pattern("^[1-9][0-9]*$")]);

  filename: string = ""

  constructor(
    private route: ActivatedRoute,
    private service: RecipeReaderService
  ) {
    this.route.paramMap.subscribe(params => {
      let value = params.get('filename');
      this.filename = value != null ? value.toString() : '001';
      this.service.firstValueFrom(this.filename).then(it => {
        this.recipe = this.service.convertRecipe(it)
      });
    })
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
    return this.service.readFavorites().indexOf(this.filename) > -1;
  }

  favorite(): void {
    this.service.addToFavorites(this.filename);
  }

  unfavorite(): void {
    this.service.removeFromFavorites(this.filename);
  }
}
