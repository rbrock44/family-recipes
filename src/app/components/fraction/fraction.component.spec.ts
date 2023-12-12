import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { FractionComponent } from './fraction.component';

describe('FractionComponent', () => {
  let fixture: ComponentFixture<FractionComponent>;
  let component: FractionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      declarations: [
        FractionComponent
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FractionComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });
});
