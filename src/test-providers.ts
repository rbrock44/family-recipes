import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

// Specs that don't set up HTTP would otherwise make real requests for assets/recipes.json.
export default [provideHttpClient(), provideHttpClientTesting()];
