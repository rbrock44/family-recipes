import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, Routes, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';

@Component({ template: '' })
class StubComponent {}

describe('app routes', () => {
  let router: Router;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    // Same URL rules, without booting the real pages.
    const stubbed: Routes = routes.map(route =>
      route.component ? { ...route, component: StubComponent } : route,
    );
    TestBed.configureTestingModule({ providers: [provideRouter(stubbed)] });
    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
  });

  it('should send old ?recipe= links to the recipe page, keeping other params', async () => {
    await harness.navigateByUrl('/?search=pie&recipe=0042');
    expect(router.url).toBe('/0042?search=pie');
  });

  it('should pad unpadded legacy ids', async () => {
    await harness.navigateByUrl('/?recipe=42');
    expect(router.url).toBe('/0042');
  });

  it('should leave home and shared-list links alone', async () => {
    await harness.navigateByUrl('/?sharedList=abc');
    expect(router.url).toBe('/?sharedList=abc');
  });

  it('should accept recipe paths with or without a name, and lists', async () => {
    for (const url of ['/0042', '/0042/apple-pie', '/lists']) {
      await harness.navigateByUrl(url);
      expect(router.url).toBe(url);
    }
  });

  it('should send unknown paths home', async () => {
    await harness.navigateByUrl('/not-a-page');
    expect(router.url).toBe('/');
  });
});
