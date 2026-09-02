import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RecipeService } from '../../services/recipe.service';
import { ListsComponent } from '../lists/lists.component';
import { HomeComponent } from '../home/home.component';
import { RecipeComponent } from '../recipe/recipe.component';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ListsComponent, HomeComponent, RecipeComponent],
})
export class MainComponent {
  constructor(public service: RecipeService) {}
}
