export enum Category {
  '' = 0,
  'Appetizers, Relishes & Pickles' = 1,
  'Soups, Salads & Sauces' = 2,
  'Meats & Main Dishes' = 3,
  'Vegetables' = 4,
  'Breads, Rolls & Pastries' = 5,
  'Cakes, Cookies & Desserts' = 6,
  'Beverages, Microwave & Miscellaneous' = 7
}

export function getCategory(num: number): string {
  const cats = Object.keys(Category).filter((item) => {
    return isNaN(Number(item));
  });

  return cats[num - 1]
}
