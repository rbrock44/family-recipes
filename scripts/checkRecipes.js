const fs = require('fs');
const path = require('path');
// Same checks the specs cover; Node strips the types when it loads the .ts file.
const { checkRecipes } = require('../src/app/utils/recipe-check.util.ts');

const KIND_TITLES = {
	numbering: 'File numbering',
	'missing-field': 'Missing name, author, or instructions',
	'bad-category': 'Category out of range',
	'no-ingredients': 'No ingredients',
	'bad-amount': 'Bad ingredient amounts',
	'unknown-unit': 'Unit-like words the unit parser does not know',
	'no-yield': 'No yield',
	duplicate: 'Possible duplicates',
};

/** Long sections (most recipes have no yield) are cut to this many lines unless --all. */
const SECTION_PREVIEW = 15;

/**
 * Prints what in src/assets/recipes looks wrong: possible typos, missing yields, unknown
 * units, duplicates and numbering gaps. It is a to-do list, not a gate: it exits 0 unless
 * --strict is passed. --json prints the raw report instead; --all prints every line.
 */
function main() {
	const args = process.argv.slice(2);
	const assetDirectory = path.resolve(__dirname, '..', 'src', 'assets', 'recipes');
	const recipes = fs
		.readdirSync(assetDirectory)
		.filter((name) => name.endsWith('.json'))
		.sort()
		.map((name) => {
			const recipe = JSON.parse(fs.readFileSync(path.join(assetDirectory, name), 'utf8'));
			return { ...recipe, filename: path.basename(name, '.json') };
		});

	const report = checkRecipes(recipes);

	if (args.includes('--json')) {
		console.log(JSON.stringify(report, null, 2));
	} else {
		printReport(report, recipes.length, args.includes('--all'));
	}

	if (args.includes('--strict') && (report.issues.length > 0 || report.typos.length > 0)) {
		process.exitCode = 1;
	}
}

function printReport(report, recipeCount, all) {
	console.log(`Checked ${recipeCount} recipes.\n`);

	for (const [kind, title] of Object.entries(KIND_TITLES)) {
		const issues = report.issues.filter((it) => it.kind === kind);
		printSection(title, issues.map((it) => `${it.filename}  ${it.message}`), all);
	}

	printSection(
		'Possible typos',
		report.typos.map((it) => `${it.word} -> ${it.suggestion}?  ${it.filenames.join(', ')}`),
		all,
	);

	const total = report.issues.length + report.typos.length;
	console.log(total === 0 ? 'Nothing to fix.' : `${total} thing(s) worth a look.`);
}

function printSection(title, lines, all) {
	if (lines.length === 0) {
		return;
	}

	console.log(`${title} (${lines.length})`);
	const shown = all ? lines : lines.slice(0, SECTION_PREVIEW);
	shown.forEach((line) => console.log(`  ${line}`));
	if (shown.length < lines.length) {
		console.log(`  ...and ${lines.length - shown.length} more (--all to list them)`);
	}
	console.log('');
}

main();
