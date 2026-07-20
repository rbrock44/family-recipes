# Family Recipes

> This project holds all the family recipes (and more) <br/>
> [Live - Family Recipes Website](https://family-recipe.ryan-brock.com/) <br/>
 
![Main](/pics/main.png)

---

## 📚 Table of Contents

- [What's My Purpose?](#-whats-my-purpose)
- [How to Use](#-how-to-use)
  - [Search](#search)
  - [Advanced Search](#advanced-search)
  - [Results](#results)
  - [Recipe Page](#recipe-page)
  - [Favorites](#favorites)
- [Import Recipes From Images](#-import-recipes-from-images)
  - [Setup](#setup)
  - [Run](#run)
  - [Images Repo and Link Field](#images-repo-and-link-field)
- [Technologies](#-technologies)
- [Getting Started (Local Setup)](#-getting-started-local-setup)
  - [Run Locally](#run-locally)
  - [Test](#test)
  - [GitHub Hooks](#github-hooks)
  - [Build](#build)
  - [Deploy](#deploy)

---

## 🧠 What's My Purpose?

This wesbite was created for my grandma (and family) to hold our family recipes. The benefit the website provides over a cookbook is quicker search access and the ability to easily change the number of batches.

<br/><br/>
To add a recipe use [Add Recipe](https://github.com/rbrock44/add-recipe)

To bulk-import recipes from photos, see [Import Recipes From Images](#-import-recipes-from-images) below.

---

## 🚦 How to Use

### Search

![Search](/pics/basic-search.png)

A search fires off for every typed character. Every word seperated by a space in the search bar has to be found in either the title, author or number. 

---

### Advanced Search

![Advanced Search](/pics/advanced-search.png)

Advanced search allows the option to only show the Hooper family or select a specific category

---

### Results

![Results](/pics/results.png)

The results are shown below in a table. The table can be sorted by any column. Click on a recipe to see more details

---

### Recipe Page 

![Recipe page](/pics/recipe.png)

The recipe page shows the title, author, ingredients and instructions for the recipe. The batch control allows the ability to alter the number of batches. The heart favorites the recipe. The top left navigation bar can be used to quickly go forward or backward through results.

---

### Favorites 

![Favorites](/pics/favorites.png)

The favorites table contain all recipes that have been hearted. Can be sorted by any column

---

## 📸 Import Recipes From Images

`scripts/recipesFromImages.js` scans a folder of recipe photos, cleans up each
image (auto-rotates via EXIF, trims borders, boosts contrast, downscales), reads
the recipe out of it with Claude vision, writes each result as a new numbered
file in `src/assets/recipes/`, and bumps `recipeTotal` in
`recipe-reader.service.ts` so the new recipes load.

### Setup

```
npm install                      # installs @anthropic-ai/sdk and sharp
export ANTHROPIC_API_KEY=sk-...  # PowerShell: $env:ANTHROPIC_API_KEY="sk-..."
```

### Run

```
npm run recipes:from-images -- --folder ./photos --author "Ryan Brock"
```

Every recipe is credited to the `--author`. If a photo has its own attribution
printed on it (a website, cookbook, or original author), that source is kept and
the author is appended, e.g. `www.recipe.com - Ryan Brock`. When no source is on
the page, the author is just `Ryan Brock`.

### Images Repo and Link Field

Each recipe gets a `link` field pointing at its photo in the
[`family-recipes-images`](https://github.com/rbrock44/family-recipes-images) repo
via raw GitHub, keyed by recipe number so `0925.json` lines up with `0925.jpg`:

```
https://raw.githubusercontent.com/rbrock44/family-recipes-images/master/0925.jpg
```

The trimmed photos are staged in a `processed/` folder next to the source
images, already renamed to their recipe number (`0925.jpg`, `0926.jpg`, …).
Drop those into the images repo and the links resolve. Override the target with
`--image-owner`, `--image-repo`, `--image-branch`, and `--image-subpath`.

Optional fields are written only when they have a value. `link` (the staged
photo) is always set. `url` is added only when the photo is a printout from
another website and that original web address is on the page. Instruction line
breaks are preserved as written (`\n` between steps, `\n\n` between sections).

Useful flags: `--dry-run` (parse and print, write nothing), `--effort` (`low`…`max`),
`--no-preprocess` (send raw images), `--help`.

---

## 🛠 Technologies

- Framework: `Angular 13`
- Testing: `Karma`
- Deployment: `GitHub Pages`

---

## 🚀 Getting Started (Local Setup)

* Install [node](https://nodejs.org/en) - v19 is needed (v22 also works)
* Clone [repo](https://github.com/rbrock44/family-recipes)

---

### Run Locally

```
npm install
npm start
```

---

### Test

- Unit
  - ng test || npm run test
- Integration
  - ng e2e || npm run e2e
        
---

### Github Hooks

- Build
    - Trigger: On Push to Main
    - Action(s): Builds application then kicks off gh page action to deploy build output

---

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

---

### Deploy

Run `npm run prod` to build and deploy the project. Make sure to be on `master` and that it is up to date before running the command. It's really meant to be a CI/CD action

---

