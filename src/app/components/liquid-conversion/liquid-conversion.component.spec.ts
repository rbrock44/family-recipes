import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { MaterialModule } from '../../material.module';
import { LiquidConversionComponent } from './liquid-conversion.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<LiquidConversionComponent>;
  let component: LiquidConversionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MaterialModule,
        RouterTestingModule
      ],
      declarations: [
        LiquidConversionComponent
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LiquidConversionComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });
});
