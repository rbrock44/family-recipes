import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { formatAmount } from '../../models/decimal.enum';
import { Ingredient } from '../../models/ingredient.interface';
import { Recipe } from '../../models/recipe.interface';
import { RecipeService } from '../../services/recipe.service';
import { WakeLockService } from '../../services/wake-lock.service';
import { splitSteps } from '../../utils/instruction-steps.util';
import { ingredientText } from '../../utils/ingredient-unit.util';
import { FractionComponent } from '../fraction/fraction.component';

@Component({
  selector: 'app-cook-mode',
  templateUrl: './cook-mode.component.html',
  styleUrls: ['./cook-mode.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatButton, MatIconButton, MatIcon, FractionComponent],
})
export class CookModeComponent implements OnInit {
  private readonly service = inject(RecipeService);
  private readonly document = inject(DOCUMENT);
  readonly wakeLock = inject(WakeLockService);

  readonly recipe = input.required<Recipe>();
  readonly batches = input(1);

  readonly steps = computed(() => splitSteps(this.recipe().instructions));
  readonly checkedIngredients = signal<Set<number>>(new Set());
  readonly doneSteps = signal<Set<number>>(new Set());
  readonly current = signal(0);
  readonly allDone = computed(
    () => this.steps().length > 0 && this.doneSteps().size === this.steps().length,
  );

  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  private previouslyFocused: HTMLElement | null = null;

  constructor() {
    this.previouslyFocused = this.document.activeElement as HTMLElement | null;
    const body = this.document.body;
    const overflow = body.style.overflow;
    body.style.overflow = 'hidden';

    afterNextRender(() => {
      this.wakeLock.acquire();
      this.dialog()?.nativeElement.focus();
    });

    inject(DestroyRef).onDestroy(() => {
      body.style.overflow = overflow;
      this.wakeLock.release();
      this.previouslyFocused?.focus();
    });
  }

  ngOnInit(): void {
    this.restoreProgress();
  }

  amount(ingredient: Ingredient): string {
    return formatAmount(ingredient.amount, this.batches());
  }

  label(ingredient: Ingredient): string {
    return ingredientText(ingredient, ingredient.amount * this.batches());
  }

  hasFraction(value: string): boolean {
    return value.indexOf('/') > 0;
  }

  toggleIngredient(index: number): void {
    this.checkedIngredients.update((checked) => toggled(checked, index));
    this.save();
  }

  /** Tapping a step checks it off and moves on; tapping a checked one goes back to it. */
  toggleStep(index: number): void {
    if (this.doneSteps().has(index)) {
      this.doneSteps.update((done) => toggled(done, index));
      this.current.set(index);
    } else {
      this.doneSteps.update((done) => toggled(done, index));
      this.current.set(this.nextOpenStep(index));
    }

    this.save();
  }

  next(): void {
    const steps = this.steps().length;
    if (steps === 0) {
      return;
    }

    const index = this.current();
    this.doneSteps.update((done) => new Set(done).add(index));
    this.current.set(Math.min(index + 1, steps - 1));
    this.save();
    this.scrollToCurrent();
  }

  previous(): void {
    this.current.update((index) => Math.max(index - 1, 0));
    this.save();
    this.scrollToCurrent();
  }

  reset(): void {
    this.checkedIngredients.set(new Set());
    this.doneSteps.set(new Set());
    this.current.set(0);
    this.service.setCookProgress(this.recipe().filename, null);
  }

  /** Done cooking: forget the checkmarks so next time starts fresh. */
  finish(): void {
    this.reset();
    this.close();
  }

  close(): void {
    this.service.closeCookMode();
  }

  onArrow(event: Event, forward: boolean): void {
    event.preventDefault();
    if (forward) {
      this.next();
    } else {
      this.previous();
    }
  }

  onTab(event: Event, isShiftTab: boolean): void {
    const dialog = this.dialog()?.nativeElement;
    if (!dialog) {
      return;
    }

    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled])'));
    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.document.activeElement;

    if (!isShiftTab && (active === last || active === dialog)) {
      event.preventDefault();
      first.focus();
    } else if (isShiftTab && (active === first || active === dialog)) {
      event.preventDefault();
      last.focus();
    }
  }

  /** On a phone the steps sit below the ingredients, so keep the current one on screen. */
  private scrollToCurrent(): void {
    setTimeout(() => {
      const step = this.dialog()?.nativeElement.querySelector<HTMLElement>('[aria-current="step"]');
      step?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    });
  }

  private nextOpenStep(from: number): number {
    const steps = this.steps().length;
    const done = this.doneSteps();

    for (let index = from + 1; index < steps; index++) {
      if (!done.has(index)) {
        return index;
      }
    }

    return Math.min(from, steps - 1);
  }

  private restoreProgress(): void {
    const progress = this.service.readCookProgress(this.recipe().filename);
    if (!progress) {
      return;
    }

    // The recipe may have been edited since, so drop anything past its end.
    const ingredients = this.recipe().ingredients.length;
    const steps = this.steps().length;
    this.checkedIngredients.set(new Set(progress.ingredients.filter((it) => it < ingredients)));
    this.doneSteps.set(new Set(progress.steps.filter((it) => it < steps)));
    this.current.set(Math.min(Math.max(progress.current, 0), Math.max(steps - 1, 0)));
  }

  private save(): void {
    this.service.setCookProgress(this.recipe().filename, {
      ingredients: Array.from(this.checkedIngredients()).sort((a, b) => a - b),
      steps: Array.from(this.doneSteps()).sort((a, b) => a - b),
      current: this.current(),
    });
  }
}

function toggled(set: Set<number>, value: number): Set<number> {
  const copy = new Set(set);
  if (copy.has(value)) {
    copy.delete(value);
  } else {
    copy.add(value);
  }
  return copy;
}
