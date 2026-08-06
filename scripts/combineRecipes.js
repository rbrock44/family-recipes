const fs = require('fs');
const path = require('path');
const prettier = require('prettier');

function resolveProjectRoot() {
	const candidateRoots = [
		path.resolve(__dirname, '..'),
		process.cwd(),
	];

	for (const root of candidateRoots) {
		const recipesDir = path.join(root, 'src', 'assets', 'recipes');
		if (fs.existsSync(recipesDir)) {
			return root;
		}
	}

	throw new Error('Unable to resolve project root. Expected to find src/assets/recipes');
}

const projectRoot = resolveProjectRoot();
const assetDirectory = path.join(projectRoot, 'src', 'assets', 'recipes');
const outputPath = path.join(projectRoot, 'src', 'assets', 'recipes.json');

async function combineRecipes() {
	const filenames = fs
		.readdirSync(assetDirectory)
		.filter(name => name.endsWith('.json'))
		.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

	const recipes = filenames.map(filename => {
		const filepath = path.join(assetDirectory, filename);
		const recipe = JSON.parse(fs.readFileSync(filepath, 'utf8'));
		recipe.filename = path.basename(filename, '.json');
		return recipe;
	});

	const formattedData = await prettier.format(JSON.stringify(recipes), {
		filepath: outputPath,
	});

	fs.writeFileSync(outputPath, formattedData);
	console.log(`Combined ${recipes.length} recipes into ${path.relative(projectRoot, outputPath)}`);

	return outputPath;
}

module.exports = { combineRecipes, outputPath };

if (require.main === module) {
	combineRecipes().catch(error => {
		console.error('Error combining recipes:', error);
		process.exit(1);
	});
}
