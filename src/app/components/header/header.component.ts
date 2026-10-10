import { Component, ChangeDetectionStrategy, afterNextRender, signal } from '@angular/core';
import { RecipeService } from 'src/app/services/recipe.service';
import { CommandPaletteService } from 'src/app/services/command-palette.service';
import { Location } from '@angular/common';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  template: `
    <div class="page-shell">
      <div class="header-bar surface-card">
        <div class="header-start">
          <button
            mat-button
            class="home-button"
            (click)="this.homeClick()"
            data-home-nav
          >
            Home
          </button>

          @if (!service.showLists) {
            <button
              mat-button
              class="lists-button"
              (click)="this.listsClick()"
              data-lists-nav
            >
              Lists
            </button>
          }

          <button
            mat-button
            class="palette-trigger"
            aria-label="Jump to a recipe"
            aria-haspopup="dialog"
            aria-keyshortcuts="Control+K Meta+K"
            (click)="palette.open()"
            data-palette-nav
          >
            <mat-icon>search</mat-icon>
            <span class="trigger-label">Jump to</span>
            <kbd>{{ shortcut() }}</kbd>
          </button>
        </div>

        @if (!service.showLists) {
          <div class="header-actions">
            <button
              mat-icon-button
              color="primary"
              (click)="this.prevClick()"
              data-previous-nav
              aria-label="Previous recipe"
            >
              <mat-icon>chevron_left</mat-icon>
            </button>
            <span class="position" data-total-nav>
              {{ service.getSelectedRecipeIndex() }}/{{
                service.searchList.length
              }}
            </span>
            <button
              mat-icon-button
              color="primary"
              (click)="this.forwardClick()"
              data-next-nav
              aria-label="Next recipe"
            >
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        }

        <button
          mat-button
          class="back-button"
          (click)="this.backClick()"
          data-back-nav
        >
          <mat-icon>undo</mat-icon>
          Back
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatButton, MatIconButton, MatIcon],
})
export class HeaderComponent {
  /** The visitor's OS is only known in the browser, so Mac gets its label after the first render. */
  readonly shortcut = signal('Ctrl K');

  constructor(
    public service: RecipeService,
    public palette: CommandPaletteService,
    private location: Location,
  ) {
    afterNextRender(() => {
      if (/Mac|iPhone|iPad/.test(navigator.userAgent)) {
        this.shortcut.set('⌘ K');
      }
    });
  }

  homeClick(): void {
    this.service.setEmptyRecipe();
    this.service.showLists = false;
    this.service.openedFromLists = false;
    this.service.activeListId = null;

    this.service.pushView(this.service.buildRecipeUrl(null));
  }

  listsClick(): void {
    this.service.returnScrollY = window.scrollY;
    this.service.showLists = true;
    this.service.pushView(this.service.buildRecipeUrl(null), { lists: true });
  }

  backClick(): void {
    // Entries the app pushed hold the previous view, so Back matches browser/mouse back.
    if (this.service.canGoBack()) {
      this.service.back();
      return;
    }

    if (this.service.showLists) {
      this.service.showLists = false;
    } else if (this.service.openedFromLists) {
      this.service.openedFromLists = false;
      this.service.showLists = true;
    } else {
      this.service.setEmptyRecipe();
    }

    const queryParams = new URLSearchParams(window.location.search);
    queryParams.delete('recipe');
    const query = queryParams.toString();

    this.location.replaceState(
      query ? `${location.pathname}?${query}` : location.pathname,
    );

    const scrollY = this.service.returnScrollY;
    setTimeout(() => window.scrollTo(0, scrollY));
  }

  // Stepping recipes replaces the entry (keeping its state) so back returns to the list.
  forwardClick(): void {
    this.location.replaceState(this.buildUrl(this.service.nextRecipe()), '', this.location.getState());
  }

  prevClick(): void {
    this.location.replaceState(this.buildUrl(this.service.previousRecipe()), '', this.location.getState());
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
