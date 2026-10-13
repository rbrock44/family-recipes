import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ABOUT_SECTIONS, AboutDialogComponent } from './about-dialog.component';

describe('AboutDialogComponent', () => {
  let fixture: ComponentFixture<AboutDialogComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutDialogComponent);
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('renders a heading for the intro and every section', () => {
    const headings = Array.from(element.querySelectorAll('h3')).map(h => h.textContent?.trim());

    expect(headings).toEqual(['Why This Exists', ...ABOUT_SECTIONS.map(section => section.title)]);
  });

  it('renders every tip with its icon', () => {
    const tips = element.querySelectorAll('.tips li');
    const total = ABOUT_SECTIONS.reduce((sum, section) => sum + section.tips.length, 0);

    expect(tips.length).toBe(total);
    expect(tips[0].querySelector('mat-icon')?.textContent).toBe(ABOUT_SECTIONS[0].tips[0].icon);
  });

  it('has a close button', () => {
    expect(element.querySelector('[mat-dialog-close]')?.textContent?.trim()).toBe('Got it');
  });
});
