import { Component } from '@angular/core';
import { RecipeService } from 'src/app/services/recipe.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-header',
  template: `
    <div>
      <div class="nav-bar-bar">
        <nav mat-tab-nav-bar>
          <div class="nav-bar-div">
            <a mat-tab-link
               mat-theme="accent"
               (click)="this.homeClick()"
               class="nav-bar-link cursor"
               data-home-nav>Home
            </a>
            <a mat-tab-link
              mat-theme="accent"
              (click)="this.prevClick()"
              class="nav-bar-link cursor"
              data-previous-nav><<
            </a>
            <a mat-tab-link
              mat-theme="accent"
              (click)="this.forwardClick()"
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
    public service: RecipeService,
    private location: Location,
  ) { }

  homeClick(): void {
    this.service.setEmptyRecipe();
    this.location.replaceState(`${location.pathname}?home=true`);
  }

  forwardClick(): void {
    this.location.replaceState(this.buildUrl(this.service.nextRecipe()));
  }

  prevClick(): void {
    this.location.replaceState(this.buildUrl(this.service.previousRecipe()));
  }

  private buildUrl(recipe: string | null): string {
    const queryParams = new URLSearchParams(window.location.search);

    if (recipe === null) {
      queryParams.delete('recipe');
    } else {
      queryParams.set('recipe', recipe);
    }

    return `${location.pathname}?${queryParams.toString()}`;
  }
}
