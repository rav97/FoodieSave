const express = require('express');
const spoonacular = require('../external/spoonacular');
const appUtils = require('../utils/app_utils');
const { verifyToken } = require('../middleware/auth');

const router = new express.Router();
router.use(verifyToken);

/**
 * Routes accessible by all the clients (logged in or not).
 */

router.get(['/', '/home'], (req, res) => {
	spoonacular.randomRecipeRequest().then((response) => {
		response = response.data;
		
		const results = [];
		response.recipes.forEach((result) => {
			const { id, title, image, summary } = result;
			const newRes = {
				id,
				image,
				title: title,
				summary: summary,
			}
			results.push(newRes);
		});
		
		res.render('home', {
			results,
			user: req.user
		});		
	})
	.catch((error) => {
		try {
			error = error.response.data;
			res.render('message', {
				user,
				message: spoonacular.errorMessage(error.code)
			});
		} catch (e) {
			res.render('message', {
				user,
				message: 'An unknown error occurred.'
			});
		}
	});
});

router.get('/about', (req, res) => {
	res.render('about', { user: req.user });
});

router.get('/search', (req, res) => {
	const user = req.user;
	const searchText = req.query.searchText;
	const pageNumber = Math.max(req.query.pageNumber, 1);  // Prevents page number <= 0.
	const resultsPerPage = 12;  // Spoonacular API allows a maximum of 10 results per request.
	spoonacular.searchRequest(searchText, pageNumber, resultsPerPage).then((response) => {
		response = response.data;
		const totalResults = response.totalResults;
		let pagination = false;  // If no results found, do not show pagination bar.
		if (totalResults > 0) {
			pagination = appUtils.searchPagination(searchText, pageNumber, resultsPerPage, totalResults);
		}

		// Filter results contents:
		const results = [];
		response.results.forEach((result) => {
			const { id, title, image, summary, dishTypes } = result;
			let isFav = false;
			if (user) {
				isFav = user.favoriteRecipes.includes(id);
			}
			const newRes = {
				id,
				image,
				isFav,
				title: title,
				summary: summary,
				dishTypes: dishTypes
			}
			results.push(newRes);
		});
	
		res.render('search', {
			results,
			searchText,
			pagination,
			user
		});		
	})
	.catch((error) => {
		try {
			error = error.response.data;
			res.render('message', {
				user,
				message: spoonacular.errorMessage(error.code)
			});
		} catch (e) {
			res.render('message', {
				user,
				message: 'An unknown error occurred.'
			});
		}
	});
});

router.get('/recipe', (req, res) => {
	const user = req.user;
	const id = req.query.id;
	spoonacular.recipeRequest(id).then((response) => {
		response = response.data;
		response.instructionsSteps = undefined;
		// analyzedInstructions is (by some reason) provided as an array with at most one object.
		if (response.analyzedInstructions.length > 0) {
			response.instructionsSteps = response.analyzedInstructions[0].steps;
		}
		response.hasSource = (response.sourceUrl || response.sourceName || response.creditsText);
		const filtered = JSON.stringify(response);
		response = JSON.parse(filtered);
		let isFav = false;
		if (user) {
			isFav = user.favoriteRecipes.includes(id);
		}
		res.render('recipe', { 
			response,
			isFav,
			user
		});
	})
	.catch((error) => {
		try {
			error = error.response.data;
			res.render('message', {
				user,
				message: spoonacular.errorMessage(error.code)
			});
		} catch (e) {
			res.render('message', {
				user,
				message: 'An unknown error occurred.'
			});
		}
	});
});

module.exports = router;
