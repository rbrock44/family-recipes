import { RecipeModel } from '../models/recipe.model';
import { matchIngredients, parseHaveList } from './ingredient-match.util';

function recipe(name: string, ingredients: string[]): RecipeModel {
  return new RecipeModel({
    name,
    filename: name,
    ingredients: ingredients.map((it) => ({ name: it, amount: 1 })),
  });
}

describe('parseHaveList', () => {
  it('splits on commas and semicolons, trimming, lowercasing and dropping repeats', () => {
    expect(parseHaveList(' Chicken,  rice ;broccoli,, chicken ')).toEqual(['chicken', 'rice', 'broccoli']);
  });

  it('is empty for blank input', () => {
    expect(parseHaveList('')).toEqual([]);
    expect(parseHaveList(null)).toEqual([]);
    expect(parseHaveList(' , ')).toEqual([]);
  });
});

describe('matchIngredients', () => {
  const recipes = [
    recipe('Casserole', ['chicken breasts', 'rice', 'cream of mushroom soup', 'cheese']),
    recipe('Fried Rice', ['rice', 'eggs', 'chicken']),
    recipe('Stir Fry', ['chicken', 'broccoli']),
    recipe('Pudding', ['rice', 'milk', 'sugar']),
  ];

  it('keeps recipes with every ingredient, fewest extra ingredients first', () => {
    const result = matchIngredients(recipes, ['chicken', 'rice']);

    expect(result.map((it) => [it.recipe.name, it.extra])).toEqual([
      ['Fried Rice', 1],
      ['Casserole', 2],
    ]);
  });

  it('matches either number of the word', () => {
    expect(matchIngredients(recipes, ['egg']).map((it) => it.recipe.name)).toEqual(['Fried Rice']);
    expect(matchIngredients(recipes, ['chicken breast']).map((it) => it.recipe.name)).toEqual(['Casserole']);

    const fruit = [recipe('Jam', ['berries', 'sugar']), recipe('Salsa', ['tomato', 'onion'])];
    expect(matchIngredients(fruit, ['berry']).map((it) => it.recipe.name)).toEqual(['Jam']);
    expect(matchIngredients(fruit, ['tomatoes']).map((it) => it.recipe.name)).toEqual(['Salsa']);
  });

  it('matches whole words only', () => {
    const corn = [recipe('Gravy', ['cornstarch', 'broth']), recipe('Chowder', ['corn', 'milk'])];

    expect(matchIngredients(corn, ['corn']).map((it) => it.recipe.name)).toEqual(['Chowder']);
  });

  it('counts an ingredient once even when two terms hit it', () => {
    const result = matchIngredients(recipes, ['cream', 'mushroom']);

    expect(result).toEqual([{ recipe: recipes[0], extra: 3 }]);
  });

  it('breaks ties by name', () => {
    const tied = [recipe('B', ['salt', 'x']), recipe('A', ['salt', 'y'])];

    expect(matchIngredients(tied, ['salt']).map((it) => it.recipe.name)).toEqual(['A', 'B']);
  });
});
