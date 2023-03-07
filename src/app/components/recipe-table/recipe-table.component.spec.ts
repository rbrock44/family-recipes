import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { MaterialModule } from '../../material.module';
import { RecipeTableComponent } from './recipe-table.component';

describe('RecipeTableComponent', () => {
  let fixture: ComponentFixture<RecipeTableComponent>;
  let component: RecipeTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        HttpClientTestingModule,
        MaterialModule,
        RouterTestingModule
      ],
      declarations: [
        RecipeTableComponent
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeTableComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });
});
