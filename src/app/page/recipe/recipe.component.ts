import {Component} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
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

  constructor(
    private route: ActivatedRoute,
    private service: RecipeService
  ) {
    this.route.paramMap.subscribe(params => {
      let value = params.get('filename');
      value = value != null ? value.toString() : '001';
      this.recipe = this.service.getRecipe(value);
    })
  }


}
