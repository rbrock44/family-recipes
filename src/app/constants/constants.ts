import { DropdownOption } from "../models/dropdown-option.model";
import { DryConversion } from "../models/dry-conversion.model";
import { LiquidConversion } from "../models/liquid-conversion.model";

export const CATEGORIES = [
  new DropdownOption('', 0),
  new DropdownOption('Appetizers, Relishes & Pickles', 1,),
  new DropdownOption('Soups, Salads & Sauces', 2,),
  new DropdownOption('Meats & Main Dishes', 3,),
  new DropdownOption('Vegetables', 4,),
  new DropdownOption('Breads, Rolls & Pastries', 5,),
  new DropdownOption('Cakes, Cookies & Desserts', 6)
];

export const DRY_CONVERSIONS = [
  new DryConversion(1, 16, 48, 128),
  new DryConversion(.75, 12, 36, 96),
  new DryConversion(.66, 10, 32, 85),
  new DryConversion(.5, 8, 24, 64),
  new DryConversion(.33, 5, 16, 43),
  new DryConversion(.25, 4, 12, 32),
  new DryConversion(.125, 2, 6, 16),
];

export const LIQUID_CONVERSIONS = [
  new LiquidConversion(1, 4, 8, 16),
  new LiquidConversion(.5, 2, 4, 8),
  new LiquidConversion(.25, 1, 2, 4),
  new LiquidConversion(.125, .5, 1, 2),
  new LiquidConversion(.0625, .25, .5, 1),
];

export function isNullOrUndefined(str: string): boolean {
  return str == null || str === 'undefined' || str === 'null';
}

export function toBoolean(value: any): boolean {
  switch (value) {
    case true:
    case 'true':
    case 1:
    case '1':
    case 'on':
    case 'yes':
      return true;
    default:
      return false;
  }
}
