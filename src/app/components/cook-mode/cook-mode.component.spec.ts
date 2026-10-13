import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CookModeComponent } from './cook-mode.component';
import { RecipeService } from '../../services/recipe.service';
import { WakeLockService } from '../../services/wake-lock.service';
import { CookProgress } from '../../models/cook-progress.interface';
import { RecipeModel } from '../../models/recipe.model';
import {
  expectElementAbsent,
  expectElementPresent,
  expectElementToContainContent,
  expectElementToContainContentAtIndex,
} from '../../constants/expectations';

const RECIPE = new RecipeModel({
  name: 'Party Mix',
  author: 'Elaine',
  category: 1,
  ingredients: [
    { name: 'c. butter', amount: 0.5 },
    { name: 'c. cereal', amount: 2 },
  ],
  instructions: 'Melt butter. Add cereal. Bake 1 hour.',
  yield: { name: 'cups', amount: 9 },
});
RECIPE.filename = '0001';

describe('CookModeComponent', () => {
  let fixture: ComponentFixture<CookModeComponent>;
  let component: CookModeComponent;
  let service: {
    readCookProgress: ReturnType<typeof vi.fn>;
    setCookProgress: ReturnType<typeof vi.fn>;
    closeCookMode: ReturnType<typeof vi.fn>;
  };
  let wakeLock: { supported: boolean; active: () => boolean; acquire: ReturnType<typeof vi.fn>; release: ReturnType<typeof vi.fn> };

  function create(progress?: CookProgress, batches = 1): void {
    service.readCookProgress.mockReturnValue(progress);
    fixture = TestBed.createComponent(CookModeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('recipe', RECIPE);
    fixture.componentRef.setInput('batches', batches);
    fixture.detectChanges();
  }

  function click(selector: string, index = 0): void {
    fixture.debugElement.queryAll(By.css(selector))[index].nativeElement.click();
    fixture.detectChanges();
  }

  function lastSaved(): CookProgress | null {
    return service.setCookProgress.mock.calls.at(-1)?.[1];
  }

  beforeEach(() => {
    service = {
      readCookProgress: vi.fn(),
      setCookProgress: vi.fn(),
      closeCookMode: vi.fn(),
    };
    wakeLock = {
      supported: true,
      active: () => true,
      acquire: vi.fn(() => Promise.resolve()),
      release: vi.fn(() => Promise.resolve()),
    };

    TestBed.configureTestingModule({
      imports: [CookModeComponent],
      providers: [
        { provide: RecipeService, useValue: service },
        { provide: WakeLockService, useValue: wakeLock },
      ],
    });
  });

  it('shows the scaled ingredients and one item per step', () => {
    create(undefined, 2);

    expectElementToContainContentAtIndex(fixture, '[data-cook-ingredient]', '1 c. butter', 0);
    expectElementToContainContentAtIndex(fixture, '[data-cook-ingredient]', '4 c. cereal', 1);
    expect(fixture.debugElement.queryAll(By.css('[data-cook-step]')).length).toBe(3);
    expectElementToContainContentAtIndex(fixture, '[data-cook-step]', 'Add cereal.', 1);
    expectElementToContainContent(fixture, '[data-cook-position]', '1 / 3');
  });

  it('keeps the screen awake while open and lets it sleep after', () => {
    create();
    expect(wakeLock.acquire).toHaveBeenCalled();
    expectElementToContainContent(fixture, '[data-cook-wake]', 'Screen stays on');

    fixture.destroy();
    expect(wakeLock.release).toHaveBeenCalled();
  });

  it('warns when the browser cannot keep the screen on', () => {
    wakeLock.supported = false;
    create();

    expectElementToContainContent(fixture, '[data-cook-wake]', 'Screen may sleep');
  });

  it('checks ingredients off and saves them', () => {
    create();
    click('[data-cook-ingredient]', 1);

    expect(component.checkedIngredients().has(1)).toBe(true);
    expect(lastSaved()).toEqual({ ingredients: [1], steps: [], current: 0 });

    click('[data-cook-ingredient]', 1);
    expect(component.checkedIngredients().has(1)).toBe(false);
  });

  it('moves through steps with next and back', () => {
    create();
    click('[data-cook-next]');

    expect(component.current()).toBe(1);
    expect(component.doneSteps().has(0)).toBe(true);
    expectElementToContainContent(fixture, '[data-cook-position]', '2 / 3');

    click('[data-cook-previous]');
    expect(component.current()).toBe(0);
  });

  it('tapping a step checks it and jumps past it; tapping again goes back to it', () => {
    create();
    click('[data-cook-step]', 0);

    expect(component.doneSteps().has(0)).toBe(true);
    expect(component.current()).toBe(1);

    click('[data-cook-step]', 0);
    expect(component.doneSteps().has(0)).toBe(false);
    expect(component.current()).toBe(0);
  });

  it('arrow keys step and escape closes', () => {
    create();
    const dialog = fixture.debugElement.query(By.css('[data-cook-mode]'));

    dialog.triggerEventHandler('keydown.arrowright', new KeyboardEvent('keydown'));
    expect(component.current()).toBe(1);

    dialog.triggerEventHandler('keydown.arrowleft', new KeyboardEvent('keydown'));
    expect(component.current()).toBe(0);

    dialog.triggerEventHandler('keydown.escape', new KeyboardEvent('keydown'));
    expect(service.closeCookMode).toHaveBeenCalled();
  });

  it('restores saved progress, ignoring anything past the recipe', () => {
    create({ ingredients: [0, 7], steps: [0, 9], current: 1 });

    expect(Array.from(component.checkedIngredients())).toEqual([0]);
    expect(Array.from(component.doneSteps())).toEqual([0]);
    expect(component.current()).toBe(1);
  });

  it('shows finish once every step is done, which clears progress and closes', () => {
    create({ ingredients: [], steps: [0, 1], current: 2 });
    expectElementAbsent(fixture, '[data-cook-done]');

    click('[data-cook-next]');
    expectElementPresent(fixture, '[data-cook-done]');

    click('[data-cook-finish]');
    expect(service.setCookProgress).toHaveBeenLastCalledWith('0001', null);
    expect(service.closeCookMode).toHaveBeenCalled();
  });

  it('reset clears everything', () => {
    create({ ingredients: [1], steps: [0], current: 1 });
    click('[data-cook-reset]');

    expect(component.checkedIngredients().size).toBe(0);
    expect(component.doneSteps().size).toBe(0);
    expect(component.current()).toBe(0);
    expect(service.setCookProgress).toHaveBeenLastCalledWith('0001', null);
  });

  it('close asks the service to leave cook mode', () => {
    create();
    click('[data-cook-close]');

    expect(service.closeCookMode).toHaveBeenCalled();
  });
});
