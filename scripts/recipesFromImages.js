/*
 * recipesFromImages.js
 *
 * Scan a folder of recipe photos, preprocess each image (auto-rotate, trim
 * borders, normalize contrast, downscale), read the recipe out of it with
 * Claude vision, and write each result as a new numbered recipe JSON file in
 * src/assets/recipes/ — then bump `recipeTotal` in recipe-reader.service.ts so
 * the new recipes load in the app.
 *
 * Each trimmed photo is staged in <folder>/processed/ named by its recipe
 * number (0925.jpg for 0925.json), and each recipe gets a `link` field pointing
 * at that image in the images repo via raw GitHub, e.g.
 * https://raw.githubusercontent.com/rbrock44/family-recipes-images/master/0925.jpg
 * Drop the staged processed/ images into that repo and the links resolve.
 *
 * Optional recipe fields are written only when present: `link` (the staged
 * image) is always set; `url` (the original recipe's web address, when the
 * photo is a printout from another site) is included only if one is on the page.
 * Instructions keep their line breaks — newlines (\n) are preserved as written.
 *
 * Usage:
 *   node scripts/recipesFromImages.js --folder ./photos --author "Ryan Brock"
 *   node scripts/recipesFromImages.js ./photos "Ryan Brock"
 *
 * Options:
 *   --folder <path>      Folder to scan for images (required; also positional #1)
 *   --author <name>      Author to credit (required; also positional #2)
 *   --model <id>         Claude model id (default: claude-opus-4-8)
 *   --effort <level>     low|medium|high|xhigh|max (default: medium)
 *   --no-preprocess      Send raw images to the model (skip crop/align/resize)
 *   --no-save-processed  Do not write the cropped/aligned previews to disk
 *   --dry-run            Preprocess + call the model, print results, write nothing
 *   --help               Show this help
 *
 * Author handling: if the image itself carries an attribution (a website, a
 * cookbook, or an original author's name), the final author becomes
 * "<detected source> - <author>", e.g. "www.recipe.com - Ryan Brock". When the
 * image has no source printed on it, the author is just "<author>".
 *
 * Requires ANTHROPIC_API_KEY in the environment (or an `ant auth login` profile).
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Dependency loading (with a friendly message if they're missing)
// ---------------------------------------------------------------------------

function requireOrExplain(moduleName) {
	try {
		return require(moduleName);
	} catch (error) {
		console.error(
			`Missing dependency "${moduleName}". Install the script's tooling with:\n` +
				`  npm install --save-dev @anthropic-ai/sdk sharp\n`,
		);
		process.exit(1);
	}
}

const Anthropic = requireOrExplain('@anthropic-ai/sdk');
const sharp = requireOrExplain('sharp');
const prettier = requireOrExplain('prettier');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tif', '.tiff', '.heic', '.heif']);
const JSON_EXTENSION = '.json';
const DEFAULT_MODEL = 'claude-opus-4-8';
const DEFAULT_EFFORT = 'medium';
// Where the recipe photos live once pushed to GitHub. Mirrors the
// woodworking-projects-images setup: raw.githubusercontent.com/<owner>/<repo>/<branch>/<NNNN>.jpg
const DEFAULT_IMAGE_OWNER = 'rbrock44';
const DEFAULT_IMAGE_REPO = 'family-recipes-images';
const DEFAULT_IMAGE_BRANCH = 'master';
// Opus 4.7+ supports images up to 2576px on the long edge; cap there so we keep
// full fidelity without paying for pixels the model can't use.
const MAX_LONG_EDGE = 2576;

const CATEGORIES = [
	'(1) Appetizers, Relishes & Pickles',
	'(2) Soups, Salads & Sauces',
	'(3) Meats & Main Dishes',
	'(4) Vegetables',
	'(5) Breads, Rolls & Pastries',
	'(6) Cakes, Cookies & Desserts',
	'(7) Beverages, Microwave & Miscellaneous',
	'(8) Rubs, Blends and Seasonings',
	'(9) Pasta',
];

// The shape each recipe file must have. Kept in sync with
// src/app/models/recipe.interface.ts (author + filename are added by this
// script, not by the model).
const RECIPE_SCHEMA = {
	type: 'object',
	additionalProperties: false,
	properties: {
		name: { type: 'string', description: 'The recipe title.' },
		source: {
			type: 'string',
			description:
				'Any attribution printed on the image: a website (e.g. "spendwithpennies.com"), a cookbook, ' +
				'or an original author\'s name. Combine them naturally if several appear ' +
				'(e.g. "Holly Nilsson - spendwithpennies.com"). Empty string if the image shows no source.',
		},
		category: {
			type: 'integer',
			enum: [1, 2, 3, 4, 5, 6, 7, 8, 9],
			description: 'Best-fit category number from the provided list.',
		},
		ingredients: {
			type: 'array',
			description: 'One entry per ingredient line, in order.',
			items: {
				type: 'object',
				additionalProperties: false,
				properties: {
					amount: {
						type: 'number',
						description:
							'Numeric quantity as a decimal (0.5 for 1/2, 0.25 for 1/4, 1.5 for 1 1/2). ' +
							'Use 0 when the line has no number (e.g. "salt to taste", "1 egg" -> 1).',
					},
					name: {
						type: 'string',
						description: 'The unit + ingredient text, e.g. "c. flour", "tsp. baking soda".',
					},
				},
				required: ['amount', 'name'],
			},
		},
		instructions: {
			type: 'string',
			description:
				'Full preparation steps. Newlines are allowed and encouraged — use "\\n" to separate ' +
				'each step or paragraph, and "\\n\\n" for a blank line between sections, exactly as the ' +
				'page is laid out. Keep numbered/bulleted step markers if the page has them.',
		},
		yield: {
			type: 'object',
			additionalProperties: false,
			properties: {
				amount: { type: 'number', description: 'Numeric yield, or 0 if not stated.' },
				name: { type: 'string', description: 'Yield unit, e.g. "cups", "servings", "cookies". Empty if not stated.' },
			},
			required: ['amount', 'name'],
		},
		url: {
			type: 'string',
			description:
				'A full web address for the original recipe if one is printed on the image ' +
				'(e.g. "https://spendwithpennies.com/braised-mushroom-chicken/"). Empty string if none is shown.',
		},
	},
	required: ['name', 'source', 'category', 'ingredients', 'instructions', 'yield', 'url'],
};

const SYSTEM_PROMPT =
	'You transcribe photographs of recipes into structured data. Read every ingredient and ' +
	'instruction exactly as written, correcting only obvious OCR-level noise. Convert all fractional ' +
	'amounts to decimals. Preserve the instructions layout using newline characters (\\n) so each ' +
	'step stays on its own line. Do not invent ingredients, steps, or yields that are not on the page.';

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
	const options = {
		folder: null,
		author: null,
		model: DEFAULT_MODEL,
		effort: DEFAULT_EFFORT,
		imageOwner: DEFAULT_IMAGE_OWNER,
		imageRepo: DEFAULT_IMAGE_REPO,
		imageBranch: DEFAULT_IMAGE_BRANCH,
		imageSubpath: '',
		preprocess: true,
		saveProcessed: true,
		dryRun: false,
		help: false,
	};

	const positionals = [];

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		switch (arg) {
			case '--help':
			case '-h':
				options.help = true;
				break;
			case '--folder':
				options.folder = argv[++i];
				break;
			case '--author':
				options.author = argv[++i];
				break;
			case '--model':
				options.model = argv[++i];
				break;
			case '--effort':
				options.effort = argv[++i];
				break;
			case '--image-owner':
				options.imageOwner = argv[++i];
				break;
			case '--image-repo':
				options.imageRepo = argv[++i];
				break;
			case '--image-branch':
				options.imageBranch = argv[++i];
				break;
			case '--image-subpath':
				options.imageSubpath = argv[++i];
				break;
			case '--no-preprocess':
				options.preprocess = false;
				break;
			case '--no-save-processed':
				options.saveProcessed = false;
				break;
			case '--dry-run':
				options.dryRun = true;
				break;
			default:
				if (arg.startsWith('--')) {
					throw new Error(`Unknown option: ${arg}`);
				}
				positionals.push(arg);
		}
	}

	if (!options.folder && positionals[0]) options.folder = positionals[0];
	if (!options.author && positionals[1]) options.author = positionals[1];

	return options;
}

function printHelp() {
	console.log(
		[
			'Scan a folder of recipe photos and turn them into recipe JSON files.',
			'',
			'Usage:',
			'  node scripts/recipesFromImages.js --folder ./photos --author "Ryan Brock"',
			'  node scripts/recipesFromImages.js ./photos "Ryan Brock"',
			'',
			'Options:',
			'  --folder <path>      Folder to scan for images (required)',
			'  --author <name>      Author to credit (required)',
			`  --model <id>         Claude model id (default: ${DEFAULT_MODEL})`,
			`  --effort <level>     low|medium|high|xhigh|max (default: ${DEFAULT_EFFORT})`,
			`  --image-owner <u>    GitHub owner of the images repo (default: ${DEFAULT_IMAGE_OWNER})`,
			`  --image-repo <name>  Images repo name (default: ${DEFAULT_IMAGE_REPO})`,
			`  --image-branch <b>   Images repo branch (default: ${DEFAULT_IMAGE_BRANCH})`,
			'  --image-subpath <p>  Optional folder inside the images repo (default: repo root)',
			'  --no-preprocess      Send raw images (skip crop/align/resize)',
			'  --no-save-processed  Do not write cropped previews to disk',
			'  --dry-run            Parse and print, but write no files',
			'  --help               Show this help',
			'',
			'Requires ANTHROPIC_API_KEY in the environment.',
		].join('\n'),
	);
}

// ---------------------------------------------------------------------------
// Project wiring (mirrors scripts/processRecipes.js)
// ---------------------------------------------------------------------------

function resolveProjectRoot() {
	const candidateRoots = [path.resolve(__dirname, '..'), process.cwd()];
	for (const root of candidateRoots) {
		const serviceFile = path.join(root, 'src', 'app', 'services', 'recipe-reader.service.ts');
		if (fs.existsSync(serviceFile)) {
			return root;
		}
	}
	throw new Error('Unable to resolve project root. Expected to find src/app/services/recipe-reader.service.ts');
}

function readStartId(recipeServicePath) {
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

function updateRecipeTotal(recipeServicePath, newTotal) {
	const serviceText = fs.readFileSync(recipeServicePath, 'utf8');
	const recipeTotalRegex = /recipeTotal\s*=\s*(\d+)\s*;/;
	const match = serviceText.match(recipeTotalRegex);
	if (!match) {
		throw new Error(`Unable to update recipeTotal in ${recipeServicePath}`);
	}
	if (Number.parseInt(match[1], 10) === newTotal) {
		return false;
	}
	fs.writeFileSync(recipeServicePath, serviceText.replace(recipeTotalRegex, `recipeTotal = ${newTotal};`));
	return true;
}

// ---------------------------------------------------------------------------
// Image handling
// ---------------------------------------------------------------------------

function listImages(folder) {
	if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
		throw new Error(`Folder not found: ${folder}`);
	}
	return fs
		.readdirSync(folder)
		.filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
		.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
		.map((name) => path.join(folder, name));
}

/**
 * Crop, align and clean up a photo so the text reads well and the payload is
 * lean. Returns a JPEG buffer.
 *
 *  - .rotate() with no angle applies the EXIF orientation, so phone photos are
 *    aligned upright (the "aligning" step).
 *  - .trim() removes uniform borders around the page (the "cropping" step).
 *  - .normalize() stretches contrast so faint print is legible.
 *  - .resize() caps the long edge at the model's max useful resolution.
 */
async function preprocessImage(imagePath, preprocess) {
	if (!preprocess) {
		return { buffer: fs.readFileSync(imagePath), mediaType: mediaTypeFor(imagePath) };
	}

	let pipeline = sharp(imagePath, { failOn: 'none' }).rotate();

	try {
		pipeline = pipeline.trim({ threshold: 10 });
	} catch {
		// .trim can throw on images that are a single flat color; ignore.
	}

	const buffer = await pipeline
		.resize({ width: MAX_LONG_EDGE, height: MAX_LONG_EDGE, fit: 'inside', withoutEnlargement: true })
		.normalize()
		.jpeg({ quality: 90 })
		.toBuffer();

	return { buffer, mediaType: 'image/jpeg' };
}

function mediaTypeFor(imagePath) {
	const ext = path.extname(imagePath).toLowerCase();
	if (ext === '.png') return 'image/png';
	if (ext === '.webp') return 'image/webp';
	if (ext === '.gif') return 'image/gif';
	return 'image/jpeg';
}

// ---------------------------------------------------------------------------
// Recipe extraction
// ---------------------------------------------------------------------------

async function extractRecipe(client, model, effort, imageBuffer, mediaType) {
	const response = await client.messages.create({
		model,
		max_tokens: 4096,
		thinking: { type: 'adaptive' },
		output_config: {
			effort,
			format: { type: 'json_schema', name: 'recipe', schema: RECIPE_SCHEMA },
		},
		system: SYSTEM_PROMPT,
		messages: [
			{
				role: 'user',
				content: [
					{
						type: 'image',
						source: { type: 'base64', media_type: mediaType, data: imageBuffer.toString('base64') },
					},
					{
						type: 'text',
						text:
							'Transcribe this recipe into the required JSON shape.\n\n' +
							'Categories to choose from:\n' +
							CATEGORIES.map((c) => `  ${c}`).join('\n') +
							'\n\nRemember: amounts are decimals (0.5, 0.25, 1.5), 0 when a line has no number. ' +
							'Put any website / cookbook / original-author attribution shown on the page into "source" ' +
							'(empty string if none). If the page shows a full web address for the original recipe (the site it was copied from), put it in "url"; otherwise leave "url" as an empty string. In "instructions", keep the step layout: use newlines (\\n) between steps and \\n\\n between sections — do not collapse everything onto one line.',
					},
				],
			},
		],
	});

	if (response.stop_reason === 'refusal') {
		throw new Error('Model refused to process the image.');
	}
	if (response.stop_reason === 'max_tokens') {
		throw new Error('Output hit max_tokens; recipe may be too long for a single pass.');
	}

	const textBlock = response.content.find((block) => block.type === 'text');
	if (!textBlock) {
		throw new Error('Model returned no text block.');
	}

	return JSON.parse(textBlock.text);
}

/**
 * Build the final recipe payload in the exact shape the app expects, folding
 * the author parameter together with any source detected on the image.
 *
 * Optional fields (recipe.interface.ts) are only written when they carry a
 * value: `link` is always present (we stage an image for every recipe); `url`
 * is included only when the image actually shows an original-recipe web address.
 */
function buildRecipePayload(parsed, authorParam, link) {
	const source = (parsed.source || '').trim();
	const author = source ? `${source} - ${authorParam}` : authorParam;

	const payload = {
		name: parsed.name,
		author,
		category: parsed.category,
		ingredients: parsed.ingredients.map((it) => ({ amount: it.amount, name: it.name })),
		instructions: parsed.instructions,
		yield: { amount: parsed.yield.amount, name: parsed.yield.name },
		link,
	};

	const url = (parsed.url || '').trim();
	if (url) {
		payload.url = url;
	}

	return payload;
}

function padNumber(num) {
	return String(num).padStart(4, '0');
}

/**
 * Raw-GitHub URL for a recipe's photo, keyed by the recipe number so
 * <NNNN>.json in this repo lines up with <NNNN>.jpg in the images repo.
 * e.g. https://raw.githubusercontent.com/rbrock44/family-recipes-images/master/0925.jpg
 */
function buildImageLink(options, recipeNumber) {
	const parts = ['https://raw.githubusercontent.com', options.imageOwner, options.imageRepo, options.imageBranch];
	const subpath = (options.imageSubpath || '').replace(/^\/+|\/+$/g, '');
	if (subpath) parts.push(subpath);
	parts.push(`${padNumber(recipeNumber)}.jpg`);
	return parts.join('/');
}

async function writeRecipeFile(assetDirectory, recipeNumber, payload) {
	const filename = `${padNumber(recipeNumber)}${JSON_EXTENSION}`;
	const filepath = path.join(assetDirectory, filename);
	const formatted = await prettier.format(JSON.stringify(payload), { filepath: filename });
	fs.writeFileSync(filepath, formatted);
	return filename;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	const options = parseArgs(process.argv.slice(2));

	if (options.help) {
		printHelp();
		return;
	}

	if (!options.folder || !options.author) {
		printHelp();
		throw new Error('Both --folder and --author are required.');
	}

	const projectRoot = resolveProjectRoot();
	const recipeServicePath = path.join(projectRoot, 'src', 'app', 'services', 'recipe-reader.service.ts');
	const assetDirectory = path.join(projectRoot, 'src', 'assets', 'recipes');

	const images = listImages(options.folder);
	if (images.length === 0) {
		console.log(`No images found in ${options.folder}`);
		return;
	}

	const client = new Anthropic();
	const startId = readStartId(recipeServicePath);

	console.log(`Found ${images.length} image(s). Recipes will start at #${startId + 1}.`);
	if (options.dryRun) console.log('(dry run — no files will be written)\n');

	const processedDir = path.join(options.folder, 'processed');
	if (options.saveProcessed && !options.dryRun) {
		fs.mkdirSync(processedDir, { recursive: true });
	}

	let written = 0;
	const failures = [];

	for (const imagePath of images) {
		const label = path.basename(imagePath);
		try {
			process.stdout.write(`\n[${label}] preprocessing... `);
			const { buffer, mediaType } = await preprocessImage(imagePath, options.preprocess);

			process.stdout.write('parsing... ');
			const parsed = await extractRecipe(client, options.model, options.effort, buffer, mediaType);

			// The next recipe number; keeps <NNNN>.json and <NNNN>.jpg in lockstep.
			const recipeNumber = startId + written + 1;
			const numbered = padNumber(recipeNumber);
			const link = buildImageLink(options, recipeNumber);
			const payload = buildRecipePayload(parsed, options.author, link);

			if (options.dryRun) {
				console.log('ok');
				console.log(`  would be: ${numbered}.json / ${numbered}.jpg`);
				console.log(`  name:   ${payload.name}`);
				console.log(`  author: ${payload.author}`);
				console.log(`  link:   ${payload.link}`);
				if (payload.url) console.log(`  url:    ${payload.url}`);
				console.log(`  category: ${payload.category}, ingredients: ${payload.ingredients.length}`);
				written++; // counted only to report how many would be written
				continue;
			}

			// Stage the trimmed photo named by recipe number, ready to drop into the images repo.
			if (options.saveProcessed) {
				const jpeg = options.preprocess ? buffer : await sharp(buffer).rotate().jpeg({ quality: 90 }).toBuffer();
				fs.writeFileSync(path.join(processedDir, `${numbered}.jpg`), jpeg);
			}

			const filename = await writeRecipeFile(assetDirectory, recipeNumber, payload);
			written++;
			console.log(`-> ${filename} + ${numbered}.jpg  "${payload.name}" by ${payload.author}`);
		} catch (error) {
			console.log('FAILED');
			console.error(`  ${error.message}`);
			failures.push({ label, message: error.message });
		}
	}

	console.log('\n----------------------------------------');
	if (options.dryRun) {
		console.log(`Dry run complete: ${written} recipe(s) would be written, ${failures.length} failed.`);
	} else {
		const newTotal = startId + written;
		if (written > 0) {
			updateRecipeTotal(recipeServicePath, newTotal);
			console.log(`Wrote ${written} recipe(s). recipeTotal is now ${newTotal}.`);
		} else {
			console.log('No recipes written; recipeTotal unchanged.');
		}
	}

	if (failures.length > 0) {
		console.log(`\n${failures.length} image(s) failed:`);
		for (const f of failures) console.log(`  - ${f.label}: ${f.message}`);
	}
}

main().catch((error) => {
	console.error(`\nError: ${error.message}`);
	process.exit(1);
});
