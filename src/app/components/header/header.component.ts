import { Component } from '@angular/core';
import { RecipeService } from 'src/app/services/recipe.service';

@Component({
  selector: 'app-header',
  template: `
    <div>
      <div class="nav-bar-bar">
        <nav mat-tab-nav-bar>
          <div class="nav-bar-div">
            <a mat-tab-link
               mat-theme="accent"
               (click)="service.setEmptyRecipe()"
               class="nav-bar-link cursor"
               data-home-nav>Home
            </a>
            <a mat-tab-link
              mat-theme="accent"
              (click)="service.previousRecipe()"
              class="nav-bar-link cursor"
              data-previous-nav><<
            </a>
            <a mat-tab-link
              mat-theme="accent"
              (click)="service.nextRecipe()"
              class="nav-bar-link cursor"
              data-next-nav>>>
            </a>
            <a mat-tab-link
               mat-theme="accent"
               class="nav-bar-link"
               data-total-nav>{{service.getSelectedRecipeIndex()}}/{{service.searchList.length}}
            </a>
          </div>
        </nav>
      </div>
    </div>
  `,
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  constructor(
    public service: RecipeService
  ) { }
}
