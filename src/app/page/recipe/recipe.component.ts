import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AddToListDialogComponent } from 'src/app/components/add-to-list-dialog/add-to-list-dialog.component';
import { REGEX_TO_HIGHLIGHT } from 'src/app/constants/constants';
import { formatAmount, trimFloat } from 'src/app/models/decimal.enum';
import { Ingredient } from 'src/app/models/ingredient.interface';
import { RecipeService } from 'src/app/services/recipe.service';
import { Recipe } from '../../models/recipe.interface';
import { RecipeModel } from '../../models/recipe.model';
import { HeaderComponent } from '../../components/header/header.component';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { NgClass } from '@angular/common';
import { FractionComponent } from '../../components/fraction/fraction.component';
import { LiquidConversionComponent } from '../../components/liquid-conversion/liquid-conversion.component';
import { DryConversionComponent } from '../../components/dry-conversion/dry-conversion.component';

@Component({
  selector: 'app-recipe',
  templateUrl: './recipe.component.html',
  styleUrls: ['./recipe.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    HeaderComponent,
    MatIconButton,
    MatIcon,
    MatFormField,
    MatLabel,
    MatInput,
    ReactiveFormsModule,
    NgClass,
    FractionComponent,
    LiquidConversionComponent,
    DryConversionComponent,
    MatButton,
  ],
})
export class RecipeComponent implements OnChanges {
  @Input() recipe: Recipe = new RecipeModel();
  showLiquid: boolean = false;
  showDry: boolean = false;
  showImage: boolean = false;
  currentPhotoIndex: number = 0;
  @ViewChild('lightboxDialog') lightboxDialog?: ElementRef<HTMLElement>;
  private previouslyFocusedElement: HTMLElement | null = null;
  batchControl: FormControl = new FormControl(1, [
    Validators.min(1),
    Validators.pattern('^[1-9][0-9]*$'),
  ]);
  decimalControl: FormControl = new FormControl(false);

  constructor(
    private service: RecipeService,
    private dialog: MatDialog,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['recipe']) {
      return;
    }

    const listId = this.service.activeListId;
    if (!listId) {
      return;
    }

    const batches = this.service.findListRecipeBatches(
      listId,
      this.recipe.filename,
    );
    this.batchControl.setValue(batches ?? 1, { emitEvent: false });
  }

  onBatchChange(): void {
    const listId = this.service.activeListId;
    if (!listId) {
      return;
    }

    this.service.setListRecipeBatches(
      listId,
      this.recipe.filename,
      this.batches(),
    );
  }

  timesBatch(value: any): string {
    const newValue: string = value == undefined ? '0' : value.toString();
    const total = this.batches() * +newValue;

    return total == 0 ? '' : trimFloat(total);
  }

  halfIngredients(firstHalf: boolean = true): Ingredient[] {
    const half = Math.ceil(this.recipe.ingredients.length / 2);

    if (firstHalf) {
      return this.recipe.ingredients.slice(0, half);
    } else {
      return this.recipe.ingredients.slice(half);
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

  allPhotos(): string[] {
    const links = [this.recipe.link, ...(this.recipe.additionalLinks || [])];
    return links.filter((it): it is string => !!it);
  }

  openImage(): void {
    this.previouslyFocusedElement = document.activeElement as HTMLElement;
    this.currentPhotoIndex = 0;
    this.showImage = true;
    setTimeout(() => this.lightboxDialog?.nativeElement.focus());
  }

  closeImage(): void {
    this.showImage = false;
    this.previouslyFocusedElement?.focus();
    this.previouslyFocusedElement = null;
  }

  nextPhoto(event: Event): void {
    event.stopPropagation();
    const photos = this.allPhotos();
    this.currentPhotoIndex = (this.currentPhotoIndex + 1) % photos.length;
  }

  previousPhoto(event: Event): void {
    event.stopPropagation();
    const photos = this.allPhotos();
    this.currentPhotoIndex =
      (this.currentPhotoIndex - 1 + photos.length) % photos.length;
  }

  onLightboxTab(event: Event, isShiftTab: boolean): void {
    const dialog = this.lightboxDialog?.nativeElement;
    if (!dialog) {
      return;
    }

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>('button:not([disabled])'),
    );
    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (!isShiftTab && active === last) {
      event.preventDefault();
      first.focus();
    } else if (isShiftTab && active === first) {
      event.preventDefault();
      last.focus();
    }
  }

  openAddToList(): void {
    this.dialog.open(AddToListDialogComponent, {
      data: { recipes: [this.recipe], defaultBatches: this.batches() },
    });
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
    return formatAmount(ingredient.amount, this.batches());
  }

  getIngredientDisplayOld(ingredient: Ingredient): string {
    return `${this.timesBatch(ingredient.amount)} ${ingredient.name}`;
  }

  hasFraction(value: string): boolean {
    const index = value.indexOf('/');
    return index > 0;
  }

  getTitle(ingredient: Ingredient): string {
    return this.regexMatch(ingredient, 'Possible conversion detected');
  }

  private batches(): number {
    // the input is free text, so an empty, half-typed, or below-1 value falls back to 1
    return Math.max(+this.batchControl.value || 1, 1);
  }

  private regexMatch(ingredient: Ingredient, matchValue: string): string {
    let value = '';
    // this uses the old decimal display of ingredient because that's what the regex was made to handle.... don't feel like updating
    let display: string = this.getIngredientDisplayOld(ingredient);
    REGEX_TO_HIGHLIGHT.forEach((regex) => {
      if (display.search(regex) > -1) {
        value = matchValue;
      }
    });

    return value;
  }
}
