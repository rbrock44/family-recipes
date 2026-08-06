const fs = require('fs');
const { combineRecipes, outputPath } = require('./combineRecipes');

async function ensureRecipesCombined() {
	if (fs.existsSync(outputPath)) {
		return;
	}

	console.log('recipes.json not found, generating it...');
	await combineRecipes();
}

ensureRecipesCombined().catch(error => {
	console.error('Error ensuring recipes.json exists:', error);
	process.exit(1);
});
