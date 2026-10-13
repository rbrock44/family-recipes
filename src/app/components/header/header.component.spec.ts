import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { expectElementToContainContentAtIndex } from '../../constants/expectations';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { CommandPaletteService } from '../../services/command-palette.service';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let component: HeaderComponent;
  let router: Router;
  let links = ['Home'];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, HeaderComponent],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.debugElement.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct links in header', () => {
    fixture.detectChanges();

    links.forEach((item, index) => {
      expectElementToContainContentAtIndex(
        fixture,
        '[data-home-nav]',
        item,
        index,
      );
    });
  });

  it('should open the jump-to palette from the header', () => {
    const palette = TestBed.inject(CommandPaletteService);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-palette-nav]').click();

    expect(palette.isOpen()).toBe(true);
  });
});
