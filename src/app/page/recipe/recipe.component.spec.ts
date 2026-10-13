import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { RecipeReaderService } from 'src/app/services/recipe-reader.service';
import { RecipeComponent } from './recipe.component';
import { RecipeService } from 'src/app/services/recipe.service';
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
});
