import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HomeComponent } from './home.component';
import { RecipeService } from '../../services/recipe.service';
import {
  expectElementPresent,
  expectElementToContainContent,
} from '../../constants/expectations.spec';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, RouterTestingModule, HomeComponent],
      providers: [
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it(`should have as title 'family-recipes'`, () => {
    expectElementToContainContent(fixture, 'h1', 'Family Recipes');
  });

  it('should have search input', () => {
    // the search panel sits behind a loading guard, so the recipes have to
    // report as loaded before it renders
    spyOn(TestBed.inject(RecipeService), 'isFullyLoaded').and.returnValue(true);
    fixture.detectChanges();

    expectElementPresent(fixture, '[data-search-input]');
    expectElementPresent(fixture, 'input');
    // scoped to the search button, since the page renders other icons first
    expectElementToContainContent(fixture, '[aria-label="Search"] mat-icon', 'search');
  });
});
