import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
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
import { ingredientText } from 'src/app/utils/ingredient-unit.util';
import { RecipeService } from 'src/app/services/recipe.service';
import { Recipe } from '../../models/recipe.interface';
import { RecipeModel } from '../../models/recipe.model';
import { HeaderComponent } from '../../components/header/header.component';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { appendSharedNote, encodeSharedNote, MAX_NOTE_LENGTH, SharedNotePayload } from 'src/app/models/note-share';
import { recipePath } from 'src/app/utils/recipe-url.util';
import { MatInput } from '@angular/material/input';
import { NgClass } from '@angular/common';
import { FractionComponent } from '../../components/fraction/fraction.component';
import { LiquidConversionComponent } from '../../components/liquid-conversion/liquid-conversion.component';
import { DryConversionComponent } from '../../components/dry-conversion/dry-conversion.component';
import { CookModeComponent } from '../../components/cook-mode/cook-mode.component';

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
    MatHint,
    MatInput,
    CdkTextareaAutosize,
    ReactiveFormsModule,
    NgClass,
    FractionComponent,
    LiquidConversionComponent,
    DryConversionComponent,
    CookModeComponent,
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
  noteControl = new FormControl('', { nonNullable: true });
  justSharedNote = false;
  // An empty note stays folded to a plus button until asked for; one with text is always open.
  notesOpen = false;

  constructor(
    private service: RecipeService,
    private dialog: MatDialog,
  ) {
    // Saved on every change, so a note can never land on the next recipe after a quick switch.
    this.noteControl.valueChanges
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((note) => this.service.setNote(this.recipe.filename, note));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['recipe']) {
      return;
    }

    this.noteControl.setValue(this.service.readNote(this.recipe.filename), { emitEvent: false });
    // Clearing a note while typing must not fold the field away under the cursor.
    this.notesOpen = this.hasNote();

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

  timesBatch(value: number | undefined): string {
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

  print(): void {
    window.print();
  }

  /** Home, showing everything this recipe's author wrote. */
  browseAuthor(): void {
    const author = this.recipe.author.trim();
    this.service.browseAuthor(author);
    this.service.setEmptyRecipe();
    this.service.showLists = false;
    this.service.openedFromLists = false;
    this.service.activeListId = null;
    const query = new URLSearchParams();
    this.service.searchAuthors.forEach(person => query.append('author', person));
    this.service.pushView(`/?${query}`);
  }

  sharedNote(): SharedNotePayload | null {
    const shared = this.service.sharedNote;
    return shared?.filename === this.recipe.filename ? shared : null;
  }

  addSharedNote(): void {
    const shared = this.sharedNote();
    if (shared) {
      this.noteControl.setValue(appendSharedNote(this.noteControl.value, shared));
      this.service.sharedNote = null;
    }
  }

  dismissSharedNote(): void {
    this.service.sharedNote = null;
  }

  hasNote(): boolean {
    return this.noteControl.value.trim() !== '';
  }

  notesShown(): boolean {
    return this.notesOpen || this.hasNote();
  }

  openNotes(): void {
    this.notesOpen = true;
  }

  shareNote(): void {
    const name = window.prompt('Add your name so they know whose note this is (optional):');

    if (name === null) {
      return;
    }

    const encoded = encodeSharedNote({
      name: name.trim(),
      filename: this.recipe.filename,
      note: this.noteControl.value.trim().slice(0, MAX_NOTE_LENGTH),
    });

    const url = new URL(recipePath(this.recipe.filename, this.recipe.name), location.href);
    url.searchParams.set('sharedNote', encoded);
    const shareUrl = url.toString();

    navigator.clipboard.writeText(shareUrl).then(
      () => {
        this.justSharedNote = true;
        setTimeout(() => {
          this.justSharedNote = false;
        }, 2000);
      },
      () => {
        window.alert(`Copy this link to share your note:\n\n${shareUrl}`);
      },
    );
  }

  isCooking(): boolean {
    return this.service.cookMode;
  }

  openCookMode(): void {
    this.service.openCookMode();
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

  /** Unit and name after the amount, e.g. "cups flour" once scaled past one. */
  ingredientLabel(ingredient: Ingredient): string {
    return ingredientText(ingredient, ingredient.amount * this.batches());
  }

  getIngredientDisplayOld(ingredient: Ingredient): string {
    return `${this.timesBatch(ingredient.amount)} ${this.ingredientLabel(ingredient)}`;
  }

  hasFraction(value: string): boolean {
    const index = value.indexOf('/');
    return index > 0;
  }

  getTitle(ingredient: Ingredient): string {
    return this.regexMatch(ingredient, 'Possible conversion detected');
  }

  batches(): number {
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
