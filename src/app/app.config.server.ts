import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { readRecipeIndex } from './recipe-index.server';
import { RECIPE_INDEX } from './services/seo.service';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: RECIPE_INDEX, useFactory: readRecipeIndex },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
