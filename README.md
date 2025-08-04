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

---

## 🚦 How to Use

### Seach

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

## 🛠 Technologies

- Framework: `Angular 13`
- Testing: `Karma`
- Deployment: `GitHub Pages`

---

## 🚀 Getting Started (Local Setup)

* Install [node](https://nodejs.org/en) - v19 is needed (v22 also works)
* Clone [repo](https://github.com/rbrock44/family-recipes)

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

