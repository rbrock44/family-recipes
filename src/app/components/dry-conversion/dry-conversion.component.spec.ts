import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { DryConversionComponent } from './dry-conversion.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<DryConversionComponent>;
  let component: DryConversionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterTestingModule,
        DryConversionComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DryConversionComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });
});
