const fs = require('fs');
const path = require('path');
const prettier = require('prettier');

const projectRoot = path.resolve(__dirname, '..');
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
	const updatedText = serviceText.replace(/recipeTotal\s*=\s*\d+\s*;/, `recipeTotal = ${newTotal};`);

	if (serviceText === updatedText) {
		throw new Error(`Unable to update recipeTotal in ${recipeServicePath}`);
	}

	fs.writeFileSync(recipeServicePath, updatedText);
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

		const newTotal = startId + data.length;
		updateRecipeTotal(newTotal);
		console.log(`Updated recipeTotal to ${newTotal}`);

	} catch (error) {
		console.error('Error processing recipe:', error);
	}
}

processRecipes();