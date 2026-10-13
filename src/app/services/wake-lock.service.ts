import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

/** Keeps the screen on while cooking. Browsers without the Wake Lock API just let it sleep. */
@Injectable({
  providedIn: 'root'
})
export class WakeLockService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private sentinel: WakeLockSentinel | null = null;
  private wanted = false;

  readonly active = signal(false);

  constructor() {
    // The browser drops the lock whenever the tab is hidden, so take it back on return.
    if (this.isBrowser) {
      const onVisibilityChange = () => {
        if (this.wanted && this.document.visibilityState === 'visible') {
          this.request();
        }
      };

      this.document.addEventListener('visibilitychange', onVisibilityChange);
      inject(DestroyRef).onDestroy(() => {
        this.document.removeEventListener('visibilitychange', onVisibilityChange);
        this.release();
      });
    }
  }

  get supported(): boolean {
    return this.isBrowser && 'wakeLock' in navigator;
  }

  acquire(): Promise<void> {
    this.wanted = true;
    return this.request();
  }

  release(): Promise<void> {
    this.wanted = false;
    const sentinel = this.sentinel;
    this.sentinel = null;
    this.active.set(false);

    return sentinel ? sentinel.release().catch(() => undefined) : Promise.resolve();
  }

  private async request(): Promise<void> {
    if (!this.supported || this.sentinel) {
      return;
    }

    try {
      const sentinel = await navigator.wakeLock.request('screen');

      // Released while the request was in flight.
      if (!this.wanted) {
        await sentinel.release();
        return;
      }

      this.sentinel = sentinel;
      this.active.set(true);
      sentinel.addEventListener('release', () => {
        if (this.sentinel === sentinel) {
          this.sentinel = null;
          this.active.set(false);
        }
      });
    } catch {
      // Denied (low battery, hidden tab, permissions policy); the screen just sleeps as usual.
      this.active.set(false);
    }
  }
}
