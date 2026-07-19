import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { LiquidConversionComponent } from './components/liquid-conversion/liquid-conversion.component';
import { MaterialModule } from './material.module';
import { HomeComponent } from './page/home/home.component';
import { RecipeComponent } from './page/recipe/recipe.component';
import { DryConversionComponent } from './components/dry-conversion/dry-conversion.component';
import { RecipeTableComponent } from './components/recipe-table/recipe-table.component';
import { FractionComponent } from './components/fraction/fraction.component';
import { MainComponent } from './page/main/main.component';

@NgModule({
  declarations: [
    AppComponent,
    DryConversionComponent,
    FractionComponent,
    HeaderComponent,
    HomeComponent,
    LiquidConversionComponent,
    MainComponent,
    RecipeComponent,
    RecipeTableComponent,
  ],
  bootstrap: [AppComponent],
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    ReactiveFormsModule,
    MaterialModule,
  ],
  providers: [provideHttpClient(withXhr(), withInterceptorsFromDi())],
})
export class AppModule {}
