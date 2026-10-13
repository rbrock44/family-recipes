const fs = require('fs');
const path = require('path');
// Same parser the app uses; Node strips the types when it loads the .ts file.
const { splitUnit } = require('../src/app/utils/ingredient-unit.util.ts');

/**
 * Moves a leading unit out of each ingredient name into its own `unit` field:
 * { amount: 0.5, name: "c. butter" } -> { amount: 0.5, unit: "cup", name: "butter" }.
 * Ingredients that already have a `unit`, or whose name starts with no known unit, are left alone.
 * Returns true when anything changed.
 */
function splitIngredientUnits(recipe) {
	let changed = false;

	recipe.ingredients = (recipe.ingredients || []).map((ingredient) => {
		if (ingredient.unit !== undefined || typeof ingredient.name !== 'string') {
			return ingredient;
		}

		const { unit, name } = splitUnit(ingredient.name);
		if (!unit) {
			return ingredient;
		}

		changed = true;
		// Rebuild so `unit` sits just before `name`, keeping any other keys where they were.
		const result = {};
		for (const [key, value] of Object.entries(ingredient)) {
			if (key === 'name') {
				result.unit = unit;
				result.name = name;
			} else {
				result[key] = value;
			}
		}
		return result;
	});

	return changed;
}

/** Rewrites every recipe file in place, keeping each file's own indentation. */
function splitAllRecipeFiles(assetDirectory) {
	const filenames = fs.readdirSync(assetDirectory).filter((name) => name.endsWith('.json'));
	let updated = 0;

	for (const filename of filenames) {
		const filepath = path.join(assetDirectory, filename);
		const raw = fs.readFileSync(filepath, 'utf8');
		const recipe = JSON.parse(raw);

		if (!splitIngredientUnits(recipe)) {
			continue;
		}

		const indent = (raw.match(/\n( +)"/) || [, '  '])[1].length;
		fs.writeFileSync(filepath, `${JSON.stringify(recipe, null, indent)}\n`);
		updated++;
	}

	return updated;
}

if (require.main === module) {
	const assetDirectory = path.resolve(__dirname, '..', 'src', 'assets', 'recipes');
	const updated = splitAllRecipeFiles(assetDirectory);
	console.log(`Split units in ${updated} recipe file(s).`);
}

module.exports = { splitIngredientUnits, splitAllRecipeFiles };
