import { DropdownOption } from "./dropdown-option.model";

export enum Category {
  '' = 0,
  'Appetizers, Relishes & Pickles' = 1,
  'Soups, Salads & Sauces' = 2,
  'Meats & Main Dishes' = 3,
  'Vegetables' = 4,
  'Breads, Rolls & Pastries' = 5,
  'Cakes, Cookies & Desserts' = 6,
  'Beverages, Microwave & Miscellaneous' = 7,
  'Rubs, Blends and Seasonings' = 8,
  'Pasta' = 9,
}

export const CATEGORIES = [
  new DropdownOption('', 0),
  new DropdownOption('Appetizers, Relishes & Pickles', 1,),
  new DropdownOption('Soups, Salads & Sauces', 2,),
  new DropdownOption('Meats & Main Dishes', 3,),
  new DropdownOption('Vegetables', 4,),
  new DropdownOption('Breads, Rolls & Pastries', 5,),
  new DropdownOption('Cakes, Cookies & Desserts', 6),
  new DropdownOption('Beverages, Microwave & Miscellaneous', 7),
  new DropdownOption('Rubs, Blends and Seasonings', 8),
  new DropdownOption('Pasta', 9),
];

export function getCategory(num: number): string {
  const cats = Object.keys(Category).filter((item) => {
    return isNaN(Number(item));
  });

  return cats[num - 1]
}
