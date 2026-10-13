import { Ingredient } from './ingredient.interface';
import { aggregateIngredients } from './ingredient-aggregator';
import { Recipe } from './recipe.interface';

function recipe(ingredients: Ingredient[]): Recipe {
  return {
    name: 'r',
    author: 'a',
    category: 0,
    instructions: '',
    filename: '0001',
    ingredients,
    yield: { name: 'servings', amount: 1 },
  };
}

describe('aggregateIngredients', () => {
  it('scales amounts by batches', () => {
    const result = aggregateIngredients([
      { recipe: recipe([{ name: 'cups flour', amount: 2 }]), batches: 3 },
    ]);

    expect(result.length).toBe(1);
    expect(result[0].amount).toBe(6);
  });

  it('merges matching unit aliases and plurals across recipes', () => {
    const result = aggregateIngredients([
      { recipe: recipe([{ name: 'cups flour', amount: 2 }]), batches: 1 },
      { recipe: recipe([{ name: 'c. Flour', amount: 1 }]), batches: 1 },
    ]);

    expect(result.length).toBe(1);
    expect(result[0].amount).toBe(3);
    expect(result[0].name).toBe('flour');
    expect(result[0].unit).toBe('cup');
  });

  it('merges a stored unit with the same unit written in the name', () => {
    const result = aggregateIngredients([
      { recipe: recipe([{ name: 'flour', unit: 'cup', amount: 2 }]), batches: 1 },
      { recipe: recipe([{ name: 'c. Flour', amount: 1 }]), batches: 2 },
    ]);

    expect(result).toEqual([{ key: 'cup|flour', amount: 4, name: 'flour', unit: 'cup' }]);
  });

  it('leaves the unit off ingredients that have none', () => {
    const result = aggregateIngredients([
      { recipe: recipe([{ name: 'eggs', amount: 2 }]), batches: 1 },
    ]);

    expect(result).toEqual([{ key: '|egg', amount: 2, name: 'eggs' }]);
  });

  it('keeps teaspoons and tablespoons apart by case', () => {
    const result = aggregateIngredients([
      { recipe: recipe([{ name: 't. salt', amount: 1 }]), batches: 1 },
      { recipe: recipe([{ name: 'T. salt', amount: 1 }]), batches: 1 },
    ]);

    expect(result.length).toBe(2);
    expect(result.map((it) => it.key).sort()).toEqual(['tbsp|salt', 'tsp|salt']);
  });

  it('does not merge different units of the same ingredient', () => {
    const result = aggregateIngredients([
      { recipe: recipe([{ name: 'cups sugar', amount: 1 }]), batches: 1 },
      { recipe: recipe([{ name: 'lbs sugar', amount: 1 }]), batches: 1 },
    ]);

    expect(result.length).toBe(2);
  });

  it('ignores notes after a comma and in parentheses', () => {
    const result = aggregateIngredients([
      { recipe: recipe([{ name: 'cups onion, diced', amount: 1 }]), batches: 1 },
      { recipe: recipe([{ name: 'cup onions (large)', amount: 1 }]), batches: 1 },
    ]);

    expect(result.length).toBe(1);
    expect(result[0].amount).toBe(2);
  });

  it('sorts by name', () => {
    const result = aggregateIngredients([
      {
        recipe: recipe([
          { name: 'eggs', amount: 2 },
          { name: 'butter', amount: 1 },
        ]),
        batches: 1,
      },
    ]);

    expect(result.map((it) => it.name)).toEqual(['butter', 'eggs']);
  });
});
