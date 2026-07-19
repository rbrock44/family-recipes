import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { FractionComponent } from './fraction.component';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';

describe('FractionComponent', () => {
  let fixture: ComponentFixture<FractionComponent>;
  let component: FractionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FractionComponent],
      imports: [BrowserAnimationsModule, RouterTestingModule],
      providers: [
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FractionComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });
});
