import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { expectElementPresent, expectElementToContainContent } from '../../constants/expectations.spec';
import { MaterialModule } from '../../material.module';
import { ConversionTableComponent } from './liquid-conversion.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<ConversionTableComponent>;
  let component: ConversionTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MaterialModule,
        RouterTestingModule
      ],
      declarations: [
        ConversionTableComponent
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConversionTableComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });
});
