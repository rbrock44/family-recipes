import { Component, ChangeDetectionStrategy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { CommandPaletteComponent } from './components/command-palette/command-palette.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterOutlet, CommandPaletteComponent],
})
export class AppComponent {
  title = 'family-recipes';
  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
}
