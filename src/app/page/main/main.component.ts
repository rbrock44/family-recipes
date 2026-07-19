import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class MainComponent {
  constructor(public service: RecipeService) {}
}
