const fs = require('fs');
const path = require('path');
const prettier = require('prettier');

function resolveProjectRoot() {
	const candidateRoots = [
		path.resolve(__dirname, '..'),
		process.cwd(),
	];

	for (const root of candidateRoots) {
		const serviceFile = path.join(root, 'src', 'app', 'services', 'recipe-reader.service.ts');
		if (fs.existsSync(serviceFile)) {
			return root;
		}
	}

	throw new Error('Unable to resolve project root. Expected to find src/app/services/recipe-reader.service.ts');
}

const projectRoot = resolveProjectRoot();
const recipeServicePath = path.join(projectRoot, 'src', 'app', 'services', 'recipe-reader.service.ts');
const assetDirectory = path.join(projectRoot, 'src', 'assets', 'recipes');
const jsonExtension = '.json';

function readStartId() {
	const serviceText = fs.readFileSync(recipeServicePath, 'utf8');
	const match = serviceText.match(/recipeTotal\s*=\s*(\d+)\s*;/);

	if (!match) {
		throw new Error(`Unable to find recipeTotal in ${recipeServicePath}`);
	}

	const parsedId = Number.parseInt(match[1], 10);
	if (!Number.isInteger(parsedId) || parsedId <= 0) {
		throw new Error(`Invalid recipeTotal value (${match[1]}) in ${recipeServicePath}`);
	}

	return parsedId;
}

function updateRecipeTotal(newTotal) {
	const serviceText = fs.readFileSync(recipeServicePath, 'utf8');
	const recipeTotalRegex = /recipeTotal\s*=\s*(\d+)\s*;/;
	const match = serviceText.match(recipeTotalRegex);

	if (!match) {
		throw new Error(`Unable to update recipeTotal in ${recipeServicePath}`);
	}

	const currentTotal = Number.parseInt(match[1], 10);
	if (currentTotal === newTotal) {
		return false;
	}

	const updatedText = serviceText.replace(recipeTotalRegex, `recipeTotal = ${newTotal};`);

	fs.writeFileSync(recipeServicePath, updatedText);
	return true;
}


async function processRecipes() {
	try {
		if (typeof fetch !== 'function') {
			throw new Error('Global fetch is not available. Use Node.js 18+ for this script.');
		}

		// Read the current recipe count from the Angular service.
		const startId = readStartId();

		// Fetch pending recipes to convert into local JSON files.
		const response = await fetch('https://home-page-api.ryan-brock.com/recipe/pending', { method: 'GET' });

		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}

		const data = await response.json();
		if (!Array.isArray(data)) {
			throw new Error('Expected pending recipes response to be an array');
		}

		// Create new numbered files in assetDirectory, continuing after recipeTotal.
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

		// if (data.length !== 0) {
			const newTotal = startId + data.length;
			const updatedRecipeTotal = updateRecipeTotal(newTotal);
			if (!updatedRecipeTotal) {
				console.log(`recipeTotal already at ${newTotal}; no update needed`);
			} else {
				console.log(`Updated recipeTotal to ${newTotal}`);
			}
		// }


	} catch (error) {
		console.error('Error processing recipe:', error);
	}
}

processRecipes();