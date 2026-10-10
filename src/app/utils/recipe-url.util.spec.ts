import { isListsPath, parseRecipeId, recipePath, recipeSlug } from './recipe-url.util';

describe('recipe-url util', () => {
  it('should slug names to lowercase ascii with hyphens', () => {
    expect(recipeSlug('Traditional Party Mix')).toBe('traditional-party-mix');
    expect(recipeSlug("Grandma's Crème Brûlée!")).toBe('grandma-s-creme-brulee');
    expect(recipeSlug('Mac & Cheese')).toBe('mac-and-cheese');
  });

  it('should build the path with the name when known', () => {
    expect(recipePath('0001', 'Puppy Chow')).toBe('/0001/puppy-chow');
    expect(recipePath('0001')).toBe('/0001');
  });

  it('should read the id from any recipe path, ignoring the name', () => {
    expect(parseRecipeId('/0001/puppy-chow')).toBe('0001');
    expect(parseRecipeId('/0001/anything-at-all')).toBe('0001');
    expect(parseRecipeId('/0001')).toBe('0001');
    expect(parseRecipeId('/1')).toBe('0001');
    expect(parseRecipeId('/0001?search=pie')).toBe('0001');
    expect(parseRecipeId('/lists')).toBeNull();
    expect(parseRecipeId('')).toBeNull();
    expect(parseRecipeId('/?recipe=0001')).toBeNull();
  });

  it('should spot the lists page', () => {
    expect(isListsPath('/lists')).toBe(true);
    expect(isListsPath('/lists/')).toBe(true);
    expect(isListsPath('/lists?x=1')).toBe(true);
    expect(isListsPath('/')).toBe(false);
  });
});
