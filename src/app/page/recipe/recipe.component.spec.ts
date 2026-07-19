import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { MaterialModule } from 'src/app/material.module';
import { RecipeReaderService } from 'src/app/services/recipe-reader.service';
import { RecipeComponent } from './recipe.component';
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
      declarations: [RecipeComponent, HeaderComponent],
      imports: [RouterTestingModule, MaterialModule],
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
});
