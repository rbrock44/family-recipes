import { TestBed } from '@angular/core/testing';
import { WakeLockService } from './wake-lock.service';

class FakeSentinel extends EventTarget {
  released = false;

  release(): Promise<void> {
    this.released = true;
    this.dispatchEvent(new Event('release'));
    return Promise.resolve();
  }
}

describe('WakeLockService', () => {
  let request: ReturnType<typeof vi.fn>;
  let sentinels: FakeSentinel[];

  function installWakeLock(): void {
    sentinels = [];
    request = vi.fn(() => {
      const sentinel = new FakeSentinel();
      sentinels.push(sentinel);
      return Promise.resolve(sentinel);
    });
    Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });
  }

  afterEach(() => {
    delete (navigator as { wakeLock?: unknown }).wakeLock;
  });

  it('is unsupported and does nothing without the API', async () => {
    const service = TestBed.inject(WakeLockService);

    expect(service.supported).toBe(false);
    await service.acquire();
    expect(service.active()).toBe(false);
    await service.release();
  });

  it('requests a screen lock and releases it', async () => {
    installWakeLock();
    const service = TestBed.inject(WakeLockService);

    await service.acquire();
    expect(request).toHaveBeenCalledWith('screen');
    expect(service.active()).toBe(true);

    await service.release();
    expect(sentinels[0].released).toBe(true);
    expect(service.active()).toBe(false);
  });

  it('only holds one lock when acquired twice', async () => {
    installWakeLock();
    const service = TestBed.inject(WakeLockService);

    await service.acquire();
    await service.acquire();

    expect(request).toHaveBeenCalledTimes(1);
  });

  it('takes the lock back when the page becomes visible again', async () => {
    installWakeLock();
    const service = TestBed.inject(WakeLockService);
    await service.acquire();

    // The browser drops the lock when the tab is hidden.
    await sentinels[0].release();
    expect(service.active()).toBe(false);

    document.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    await Promise.resolve();

    expect(request).toHaveBeenCalledTimes(2);
    expect(service.active()).toBe(true);
  });

  it('does not take the lock back after release', async () => {
    installWakeLock();
    const service = TestBed.inject(WakeLockService);
    await service.acquire();
    await service.release();

    document.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();

    expect(request).toHaveBeenCalledTimes(1);
  });

  it('stays inactive when the request is denied', async () => {
    Object.defineProperty(navigator, 'wakeLock', {
      value: { request: () => Promise.reject(new Error('denied')) },
      configurable: true,
    });
    const service = TestBed.inject(WakeLockService);

    await service.acquire();

    expect(service.active()).toBe(false);
  });
});
