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
  new DryConversion(.0625, 1, 3, 8),
];

export const LIQUID_CONVERSIONS = [
  new LiquidConversion(1, 4, 8, 16),
  new LiquidConversion(.5, 2, 4, 8),
  new LiquidConversion(.25, 1, 2, 4),
  new LiquidConversion(.125, .5, 1, 2),
  new LiquidConversion(.0625, .25, .5, 1),
];

const THREE_RX = '[1-9]\\d{2,}';
const TWO_RX = '[1-9]\\d';
const DECIMAL_RX = '(?:\\.[0-9]+)?';
// `^(([1-9](?:\.[0-9]+)?)|([1-9]\d{2,}(?:\.[0-9]+)?)) tsp`,

export const REGEX_TO_HIGHLIGHT = [
  // liquid conversions
  // `^([2-9]|${TWO_RX}|${THREE_RX}) c`,
  `^(([2-9]${DECIMAL_RX})|(${TWO_RX}${DECIMAL_RX})|(${THREE_RX}${DECIMAL_RX})) qrt`,
  `^(([2-9]${DECIMAL_RX})|(${TWO_RX}${DECIMAL_RX})|(${THREE_RX}${DECIMAL_RX})) qu`,
  `^(([2-9]${DECIMAL_RX})|(${TWO_RX}${DECIMAL_RX})|(${THREE_RX}${DECIMAL_RX})) p`,
  // dry conversions
  `^(([4-9]${DECIMAL_RX})|(${TWO_RX}${DECIMAL_RX})|(${THREE_RX}${DECIMAL_RX})) tbsp`,
  `^(([4-9]${DECIMAL_RX})|(${TWO_RX}${DECIMAL_RX})|(${THREE_RX}${DECIMAL_RX})) ta`,
  `^(([3-9]${DECIMAL_RX})|(${TWO_RX}${DECIMAL_RX})|(${THREE_RX}${DECIMAL_RX})) tsp`,
  `^(([3-9]${DECIMAL_RX})|(${TWO_RX}${DECIMAL_RX})|(${THREE_RX}${DECIMAL_RX})) tea`,
  `^(([1][6-9])|([2-9]\\d)|(${THREE_RX}${DECIMAL_RX})) g`,
]

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
