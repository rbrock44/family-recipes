const fs = require('fs');
const path = require('path');
const prettier = require('prettier');
const { combineRecipes, outputPath } = require('./combineRecipes');

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
const jsonExtension = '.json';

async function getCurrentRecipeNumber() {
	await combineRecipes();

	const combined = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
	if (combined.length === 0) {
		return 0;
	}

	const lastFilename = combined[combined.length - 1].filename;
	const lastNumber = Number.parseInt(lastFilename, 10);
	if (!Number.isInteger(lastNumber)) {
		throw new Error(`Unable to parse recipe number from filename "${lastFilename}"`);
	}

	return lastNumber;
}

async function processRecipes() {
	try {
		if (typeof fetch !== 'function') {
			throw new Error('Global fetch is not available. Use Node.js 18+ for this script.');
		}

		const startId = await getCurrentRecipeNumber();

		// Fetch pending recipes to convert into local JSON files.
		const response = await fetch('https://home-page-api.ryan-brock.com/recipe/pending', {
			method: 'GET',
			headers: {
				'X-API-Key': process.env.RECIPE_API_TOKEN ?? '',
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}

		const data = await response.json();
		if (!Array.isArray(data)) {
			throw new Error('Expected pending recipes response to be an array');
		}

		// Create new numbered files in assetDirectory, continuing after startId.
		for (const [index, recipe] of data.entries()) {
			const recipePayload = recipe.payload;
			const newRecipeNumber = startId + (index + 1);
			const filename = `${String(newRecipeNumber).padStart(4, '0')}${jsonExtension}`;
			const filepath = path.join(assetDirectory, filename);

			const formattedData = await prettier.format(JSON.stringify(recipePayload), {
				filepath: filename,
			});

			fs.writeFileSync(filepath, formattedData);
			console.log(`Created file: ${filename}`);
		}

		if (data.length === 0) {
			console.log('No pending recipes to process.');
		} else {
			console.log(`Wrote ${data.length} recipe(s), starting at #${startId + 1}.`);
		}
	} catch (error) {
		console.error('Error processing recipe:', error);
	}
}

processRecipes();
