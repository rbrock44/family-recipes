import { DropdownOption } from "../models/dropdown-option.model";
import { DryConversion } from "../models/dry-conversion.model";
import { LiquidConversion } from "../models/liquid-conversion.model";
import { Recipe } from "../models/recipe.interface";
import { RecipeModel } from "../models/recipe.model";

// Values are exact ratios, not rounded decimals: the tables render them as
// mixed fractions, so 2/3 cup has to stay 2/3 (10 2/3 tbsp) rather than .66.
export const DRY_CONVERSIONS = [
  new DryConversion(1, 16, 48, 128),
  new DryConversion(3 / 4, 12, 36, 96),
  new DryConversion(2 / 3, 32 / 3, 32, 85),
  new DryConversion(1 / 2, 8, 24, 64),
  new DryConversion(1 / 3, 16 / 3, 16, 43),
  new DryConversion(1 / 4, 4, 12, 32),
  new DryConversion(1 / 8, 2, 6, 16),
  new DryConversion(1 / 16, 1, 3, 8),
];

// Argument order matches the column order: gallons, quarts, pints, cups.
export const LIQUID_CONVERSIONS = [
  new LiquidConversion(1, 4, 8, 16),
  new LiquidConversion(1 / 2, 2, 4, 8),
  new LiquidConversion(1 / 4, 1, 2, 4),
  new LiquidConversion(1 / 8, 1 / 2, 1, 2),
  new LiquidConversion(1 / 16, 1 / 4, 1 / 2, 1),
];

export const HOOPER_FAMILY: string[] = [
  'C. Allen Collier',
  'Caleb Estes',
  'Catrina Stone',
  'Charlotte Hooper',
  'Christine Estes',
  'Cheryl Stone',
  'In Memory of Ella I. Schlosser, Charlotte Hooper',
  'Joan Drury',
  'Rebecca Hooper',
  'Ryan Brock',
  'Ryan Hooper Brock',
  'Sara Hooper',
  'Zachary Estes',
];

// Brands, magazines and restaurants a recipe came from, keyed lowercase. Not people, so
// Browse by Author leaves them out.
export const AUTHOR_SOURCES: string[] = [
  '12 tomatoes',
  'blue bonnet',
  'dole',
  'general mills',
  'great value',
  'happy times',
  'heygrillhey',
  'kraft',
  'mature living',
  'pasta house',
  'pf chang',
  'robin hood pre-sifted flour',
  'savory sweet life',
  "woman's world",
];

// Other spellings of one person, keyed lowercase, so Browse by Author shows them once.
export const AUTHOR_ALIASES: Record<string, string> = {
  'ryan hooper brock': 'Ryan Brock',
  'shelley dohogne': 'Shelly Dohogne',
  'hazel leubbers': 'Hazel Luebbers',
  'anna rose bless': 'Anna Rose Bles',
  'shirley efting': 'Shirley Eftink',
  'lorenna essner': 'Lorena Essner',
  'martha hamm': 'Martha J. Hamm',
  'joan m. drury': 'Joan Drury',
  'marian essner': 'Marian M. Essner',
  'louise maria': 'Louise Maria Blankenship',
  'aunt mary welter': 'Mary Welter',
  'aunt bert dumey': 'Bert Dumey',
  'mrs. theon schlosser': 'Ella I. Schlosser',
  'helen schlosser': 'Helen T. Schlosser',
  'mrs. william schlosser': 'Pat Schlosser',
  'st. augustine school cafeteria': 'St. Augustine Cafeteria',
  'kelso ladies': 'Kelso Ladies Sodality',
  'denise pepin chicago': 'Denise Pepin',
  'favorite recipe of the dave carmen family': 'Dave Carmen Family',
  'paula dean': 'Paula Deen',
};

export const EMPTY_RECIPE: Recipe = new RecipeModel()

const THREE_RX = '[1-9]\\d{2,}';
const TWO_RX = '[1-9]\\d';
const DECIMAL_RX = '(?:\\.[0-9]+)?';
// `^(([1-9](?:\.[0-9]+)?)|([1-9]\d{2,}(?:\.[0-9]+)?)) tsp`,

export const REGEX_TO_HIGHLIGHT = [
  // liquid conversions
  // `^([2-9]|${TWO_RX}|${THREE_RX}) c`,
  `^(([2-9]${DECIMAL_RX})|(${TWO_RX}${DECIMAL_RX})|(${THREE_RX}${DECIMAL_RX})) qt`,
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

export function toBoolean(value: unknown): boolean {
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
