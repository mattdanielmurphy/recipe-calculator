// input: object of ingredients with volumes in ml
// output: object of ingredients with volumes in tbsp and tsp
// can use 1/2, 1/4, and 3/4 tsp but NO 1/2 TBSP

// per kg
const prompts = require('prompts')

const recipes = [
	{
		name: 'taco seasoning',
		oneServing: 'For 1kg of ground beef',
		ingredients: {
			'Chili powder': 32.6,
			'Garlic powder': 2.72,
			'Onion powder': 2.72,
			'Crushed red pepper flakes': 2.72,
			'Dried oregano': 2.72,
			Paprika: 5.43,
			'Ground cumin': 19.56,
			'Sea salt': 32.6,
			'Black pepper': 10.87,
			'Total Volume': 111.94
		}
	},
	{
		name: 'tortillas',
		oneServing: '8 tortillas',
		ingredients: {
			'almond flour': 202.83,
			'coconut flour': 48.24,
			'xantham gum': 9.8564,
			'baking powder': 4.9282,
			salt: 1.23205,
			'Total volume (dry ingredients)': 267.08665,
			'apple cider vinegar': 9.8564,
			egg: [ 'non-volumetric', 1 ],
			water: 14.7846
		}
	}
]

const measurements = {
	cup: 236.588,
	'1/2 cup': 118.294,
	'1/3 cup': 78.862667,
	'1/4 cup': 59.147,
	tablespoon: 14.7868,
	teaspoon: 4.9282,
	'1/2 teaspoon': 2.4641,
	'1/4 teaspoon': 1.23205
}

function getRecipe(ingredients, servings) {
	const smallestMeasurement = Object.values(measurements)[Object.values(measurements).length - 1]
	const recipe = {}
	for (const i in ingredients) {
		let volume = ingredients[i]
		let nonVolumetricQuantity
		volume.length > 1 ? (nonVolumetricQuantity = volume[1] * servings) : (volume *= servings)
		const measurementsForIngredient = {}

		function getLargestMeasurement(volume) {
			let measurement
			for (const m in measurements) {
				measurement = measurements[m]
				// if measurement is below volume, push amount of that measurement
				if (measurement <= volume) {
					// get amount of measurements: vol - (vol % measurement) / measurement
					let amount = (volume - volume % measurement) / measurement
					volume -= amount * measurement
					if (measurementsForIngredient[m]) {
						measurementsForIngredient[m] += amount
					} else measurementsForIngredient[m] = amount
				}
			}
			let remainder = volume % measurement
			if (remainder < smallestMeasurement) return measurementsForIngredient
			else return getLargestMeasurement(remainder)
		}
		if (nonVolumetricQuantity) {
			let plurality = nonVolumetricQuantity > 1 ? 's' : ''
			recipe[`${nonVolumetricQuantity} ${i}${plurality}`] = ''
		} else recipe[i] = getLargestMeasurement(volume)
	}
	return recipe
}

function printRecipe(recipe) {
	console.log('Ingredients:\n')

	for (const ingredient in recipe) {
		let divider = recipe[ingredient] === '' ? '' : ': '
		process.stdout.write(`${ingredient}${divider}`)

		Object.entries(recipe[ingredient]).forEach(([ measurement, amount ], index, object) => {
			const fractionalMeasurement = /\d\/\d/.test(measurement)

			if (amount === 1 && fractionalMeasurement) amount = ''
			else amount += ' '

			let plurality = amount > 1 ? 's' : ''
			let comma = index < object.length - 1 ? ', ' : ''
			process.stdout.write(`${amount}${measurement}${plurality}${comma}`)
		})
		process.stdout.write('\n')
	}
}

async function askServings(oneServing) {
	let chosenServings
	await prompts({
		type: 'number',
		name: 'servings',
		message: `How many servings? (${oneServing})`,
		min: 1,
		initial: 1
	}).then(({ servings }) => (chosenServings = Number(servings)))
	return chosenServings
}

async function askRecipe() {
	let chosenRecipe
	let choices = []
	await recipes.forEach((recipe) => {
		choices.push({
			title: recipe.name,
			value: recipe
		})
	})
	await prompts({
		type: 'select',
		name: 'recipe',
		message: `What recipe?`,
		initial: 0,
		choices
	}).then(({ recipe }) => (chosenRecipe = recipe))
	return chosenRecipe
}

async function askQuestions() {
	let chosenIngredients
	let chosenOneServing
	await askRecipe().then(({ ingredients, oneServing }) => {
		chosenIngredients = ingredients
		chosenOneServing = oneServing
	})
	await askServings(chosenOneServing).then((servings) => {
		let recipe = getRecipe(chosenIngredients, servings)
		printRecipe(recipe)
	})
}

askQuestions()
