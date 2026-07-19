import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { MaterialModule } from '../../material.module';
import { RecipeTableComponent } from './recipe-table.component';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';

describe('RecipeTableComponent', () => {
  let fixture: ComponentFixture<RecipeTableComponent>;
  let component: RecipeTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RecipeTableComponent],
      imports: [BrowserAnimationsModule, MaterialModule, RouterTestingModule],
      providers: [
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeTableComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });
});
