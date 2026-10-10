import { Injectable, signal } from '@angular/core';

/** Open state for the jump-to palette, shared so the header button and the shortcut agree. */
@Injectable({
  providedIn: 'root'
})
export class CommandPaletteService {
  readonly isOpen = signal(false);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
