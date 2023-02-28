import {ComponentFixture, TestBed} from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {HomeComponent} from './home.component';
import {expectElementPresent, expectElementToContainContent} from '../../constants/expectations.spec';
import {MaterialModule} from '../../material.module';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        HttpClientTestingModule,
        MaterialModule,
        RouterTestingModule
      ],
      declarations: [
        HomeComponent
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
    expectElementPresent(fixture, '[data-search-input]');
    expectElementPresent(fixture, 'input');
    expectElementToContainContent(fixture, 'mat-icon', 'search');
  });
});
