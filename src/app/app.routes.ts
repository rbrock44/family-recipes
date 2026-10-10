import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, Routes } from '@angular/router';
import { MainComponent } from './page/main/main.component';
import { isRecipeId } from './utils/recipe-url.util';

/** Sends old `/?recipe=<id>` links to the recipe's own page; the name is filled in once it loads. */
export const redirectLegacyRecipe: CanActivateFn = route => {
  const recipe = route.queryParamMap.get('recipe');
  if (!isRecipeId(recipe ?? undefined)) {
    return true;
  }

  const { recipe: _, ...queryParams } = route.queryParams;
  return inject(Router).createUrlTree(['/', recipe!.padStart(4, '0')], { queryParams });
};

const matchesRecipeId: CanMatchFn = (_, segments) => isRecipeId(segments[0]?.path);

// MainComponent picks the view from the URL and service state, so the child routes only
// decide which URLs are valid. Sharing one parent keeps MainComponent alive across them.
export const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      { path: '', pathMatch: 'full', canActivate: [redirectLegacyRecipe], children: [] },
      { path: 'lists', children: [] },
      { path: ':id', canMatch: [matchesRecipeId], children: [] },
      { path: ':id/:name', canMatch: [matchesRecipeId], children: [] },
    ],
  },
  { path: '**', redirectTo: '' },
];
