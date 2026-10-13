import { TestBed } from '@angular/core/testing';
import { CommandPaletteService } from './command-palette.service';

describe('CommandPaletteService', () => {
  let service: CommandPaletteService;

  beforeEach(() => {
    service = TestBed.inject(CommandPaletteService);
  });

  it('starts closed', () => {
    expect(service.isOpen()).toBe(false);
  });

  it('opens and closes', () => {
    service.open();
    expect(service.isOpen()).toBe(true);

    service.close();
    expect(service.isOpen()).toBe(false);
  });

  it('is shared, so the header button and the shortcut see the same state', () => {
    service.open();

    expect(TestBed.inject(CommandPaletteService).isOpen()).toBe(true);
  });
});
