import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { RecipeReaderService } from 'src/app/services/recipe-reader.service';
import { RecipeComponent } from './recipe.component';
import { RecipeService } from 'src/app/services/recipe.service';
import { RecipeModel } from 'src/app/models/recipe.model';
import { decodeSharedNote } from 'src/app/models/note-share';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';

describe('RecipeComponent', () => {
  let fixture: ComponentFixture<RecipeComponent>;
  let component: RecipeComponent;
  let service: RecipeReaderService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, RecipeComponent, HeaderComponent],
      providers: [
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    service = TestBed.inject(RecipeReaderService);
    fixture = TestBed.createComponent(RecipeComponent);
  });

  it('should create the app', () => {
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should open cook mode from the cook button', () => {
    const recipeService = TestBed.inject(RecipeService);
    const open = vi.spyOn(recipeService, 'openCookMode').mockImplementation(() => {
      recipeService.cookMode = true;
    });
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-cook-mode-open]').click();
    fixture.detectChanges();

    expect(open).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[data-cook-mode]')).toBeTruthy();
  });

  it('should print from the print button', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-print]').click();

    expect(print).toHaveBeenCalled();
  });

  it('should only add the batch count for print when scaled', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-batches-print]')).toBeNull();

    fixture.componentInstance.batchControl.setValue(3);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-batches-print]').textContent).toContain('3 batches');
  });

  it('should show the unit, pluralized for the scaled amount, and flag likely conversions', () => {
    fixture.componentRef.setInput('recipe', {
      ...new RecipeModel(),
      filename: '0001',
      name: 'Pie',
      ingredients: [
        { amount: 1, unit: 'cup', name: 'flour' },
        { amount: 1.5, unit: 'tsp', name: 'salt' },
        { amount: 2, name: 'eggs' },
      ],
    });
    fixture.componentInstance.batchControl.setValue(2);
    fixture.detectChanges();

    const lines = Array.from(fixture.nativeElement.querySelectorAll('.ingredient')) as HTMLElement[];
    const text = lines.map((it) => it.textContent!.replace(/\s+/g, ' ').trim());

    expect(text).toEqual(['2 cups flour', '3 tsp salt', '4 eggs']);
    expect(lines[1].classList).toContain('underline');
    expect(lines[0].classList).not.toContain('underline');
  });

  it('should open everything by the author from the byline', () => {
    const recipeService = TestBed.inject(RecipeService);
    const push = vi.spyOn(recipeService, 'pushView').mockImplementation(() => {});
    fixture.componentRef.setInput('recipe', { ...new RecipeModel(), filename: '0001', author: 'Anne Brock ' });
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-author-link]').click();

    expect(recipeService.searchAuthors).toEqual(['Anne Brock']);
    expect(recipeService.selectedRecipe.filename).toBe('');
    expect(push).toHaveBeenCalledWith('/?author=Anne+Brock');
  });

  describe('notes', () => {
    let recipeService: RecipeService;

    const show = (filename: string) => {
      fixture.componentRef.setInput('recipe', { ...new RecipeModel(), filename, name: 'Pie' });
      fixture.detectChanges();
    };

    beforeEach(() => {
      recipeService = TestBed.inject(RecipeService);
    });

    afterEach(() => {
      recipeService.sharedNote = null;
    });

    it('loads the note for the recipe shown and saves edits to it', () => {
      vi.spyOn(recipeService, 'readNote').mockImplementation((filename) => (filename === '0001' ? 'Less salt' : ''));
      const save = vi.spyOn(recipeService, 'setNote').mockImplementation(() => {});

      show('0001');
      const input = fixture.nativeElement.querySelector('[data-note-input]') as HTMLTextAreaElement;
      expect(input.value).toBe('Less salt');

      input.value = 'Less salt, more butter';
      input.dispatchEvent(new Event('input'));
      expect(save).toHaveBeenLastCalledWith('0001', 'Less salt, more butter');

      show('0002');
      expect(input.value).toBe('');
      expect(save).toHaveBeenCalledTimes(1);
    });

    it('only offers sharing once there is a note, and copies a recipe link carrying it', async () => {
      vi.spyOn(recipeService, 'readNote').mockReturnValue('');
      vi.spyOn(recipeService, 'setNote').mockImplementation(() => {});
      vi.spyOn(window, 'prompt').mockReturnValue(' Ryan ');
      const copy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();

      show('0001');
      expect(fixture.nativeElement.querySelector('[data-share-note]')).toBeNull();

      fixture.componentInstance.noteControl.setValue('Less salt');
      fixture.detectChanges();
      fixture.nativeElement.querySelector('[data-share-note]').click();

      const url = new URL(copy.mock.calls[0][0]);
      expect(url.pathname).toBe('/0001/pie');
      expect(decodeSharedNote(url.searchParams.get('sharedNote')!)).toEqual({
        name: 'Ryan',
        filename: '0001',
        note: 'Less salt',
      });
    });

    it('shows a shared note on its own recipe only, and adds it under mine', () => {
      vi.spyOn(recipeService, 'readNote').mockReturnValue('Mine');
      const save = vi.spyOn(recipeService, 'setNote').mockImplementation(() => {});
      recipeService.sharedNote = { name: 'Grandma', filename: '0001', note: 'Less salt' };

      show('0002');
      expect(fixture.nativeElement.querySelector('[data-shared-note]')).toBeNull();

      show('0001');
      expect(fixture.nativeElement.querySelector('[data-shared-note]').textContent).toContain('Note from Grandma');

      fixture.nativeElement.querySelector('[data-add-shared-note]').click();
      fixture.detectChanges();

      expect(save).toHaveBeenLastCalledWith('0001', 'Mine\n\nFrom Grandma: Less salt');
      expect(recipeService.sharedNote).toBeNull();
      expect(fixture.nativeElement.querySelector('[data-shared-note]')).toBeNull();
    });
  });
});
