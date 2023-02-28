import {Component} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import { Ingredient } from 'src/app/models/ingredient.interface';
import { RecipeReaderService } from 'src/app/services/recipe-reader.service';
import {Recipe} from '../../models/recipe.interface';
import {RecipeModel} from '../../models/recipe.model';
import {RecipeService} from '../../services/recipe.service';

@Component({
  selector: 'app-root',
  templateUrl: './recipe.component.html',
  styleUrls: ['./recipe.component.scss']
})
export class RecipeComponent {
  recipe: Recipe = new RecipeModel();
  batchControl: FormControl = new FormControl(1, [Validators.min(1), Validators.pattern("^[1-9][0-9]*$")]);

  constructor(
    private route: ActivatedRoute,
    private service: RecipeReaderService
  ) {
    this.route.paramMap.subscribe(params => {
      let value = params.get('filename');
      value = value != null ? value.toString() : '001';
      this.service.firstValueFrom(value).then(it => {
        this.recipe = this.service.convertRecipe(it)
      });
    })
  }

  timesBatch(value: any): number {
    const newValue: string = value == undefined ? '0' : value.toString();

    return this.batchControl.value * +newValue
  }

  
  halfIngredients(firstHalf: boolean = true): Ingredient[] {
    const half = Math.ceil(this.recipe.ingredients.length / 2); 

    if (firstHalf) {
      return this.recipe.ingredients.slice(0, half)
    } else {
      return this.recipe.ingredients.slice(half)
    }
  }
}
