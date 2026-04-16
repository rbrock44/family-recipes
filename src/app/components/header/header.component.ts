import { Component } from '@angular/core';
import { RecipeService } from 'src/app/services/recipe.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-header',
  template: `
    <div class="page-shell">
      <div class="header-bar surface-card">
        <button mat-button class="home-button" (click)="this.homeClick()" data-home-nav>Home</button>

        <div class="header-actions">
          <button mat-icon-button color="primary" (click)="this.prevClick()" data-previous-nav aria-label="Previous recipe">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <button mat-icon-button color="primary" (click)="this.forwardClick()" data-next-nav aria-label="Next recipe">
            <mat-icon>chevron_right</mat-icon>
          </button>
          <span class="position" data-total-nav>
            {{service.getSelectedRecipeIndex()}}/{{service.searchList.length}}
          </span>
        </div>
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
    this.location.replaceState(`${location.pathname}`);
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
