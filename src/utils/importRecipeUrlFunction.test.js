import { afterEach, expect, test, vi } from 'vitest';
import { handler } from '../../netlify/functions/import-recipe-url.js';

const ORIGINAL_OPENAI_API_KEY = process.env.OPENAI_API_KEY;

afterEach(() => {
  vi.restoreAllMocks();
  if (ORIGINAL_OPENAI_API_KEY === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = ORIGINAL_OPENAI_API_KEY;
  }
});

test('imports schema.org recipe JSON-LD from a webpage URL', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    text: async () => `
      <html>
        <head>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "name": "Test Pancakes",
              "recipeCuisine": "American",
              "totalTime": "PT20M",
              "recipeIngredient": ["1/2 cup milk", "salt to taste"],
              "recipeInstructions": [
                { "@type": "HowToStep", "text": "Mix batter." },
                { "@type": "HowToStep", "text": "Cook pancakes." }
              ]
            }
          </script>
        </head>
      </html>
    `
  });

  const response = await handler({
    httpMethod: 'POST',
    body: JSON.stringify({ url: 'https://example.com/pancakes' })
  });

  const payload = JSON.parse(response.body);

  expect(response.statusCode).toBe(200);
  expect(payload.source).toBe('json-ld');
  expect(payload.recipe.title).toBe('Test Pancakes');
  expect(payload.recipe.prep_time_minutes).toBe(20);
  expect(payload.recipe.ingredients[0].items[0]).toMatchObject({
    amount: 0.5,
    amount_text: '1/2',
    unit: 'cup',
    name: 'milk',
    scalable: true
  });
  expect(payload.recipe.ingredients[0].items[1]).toMatchObject({
    amount: null,
    unit: '',
    name: 'salt to taste',
    scalable: false
  });
  expect(payload.recipe.steps).toHaveLength(2);
});

test('imports WP Recipe Maker data before falling back to OpenAI', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    text: async () => `
      <html>
        <body>
          <script>
            window.wprm_recipes = {
              "recipe-61591": {
                "name": "Air Fryer Tofu",
                "image_url": "https://example.com/tofu.jpg",
                "ingredients": [
                  {
                    "amount": "14",
                    "unit": "ounces",
                    "name": "extra-firm tofu",
                    "notes": "",
                    "unit_systems": {
                      "unit-system-1": {
                        "amount": "14",
                        "unit": "ounces"
                      }
                    }
                  },
                  {
                    "amount": "½",
                    "unit": "tablespoon",
                    "name": "avocado oil",
                    "notes": ""
                  }
                ]
              }
            }
          </script>
          <div class="wprm-recipe-total-time-container">
            <span class="wprm-recipe-time">
              <span class="wprm-recipe-details wprm-recipe-total_time-minutes">45</span>
              <span class="wprm-recipe-total_timeunit-minutes">mins</span>
            </span>
          </div>
          <div class="wprm-recipe-servings-container">
            <span class="wprm-recipe-servings">4</span>
          </div>
          <div class=wprm-recipe-instruction-text><span>Press the tofu.</span></div>
          <div class=wprm-recipe-instruction-text>Air fry until crisp.</div>
        </body>
      </html>
    `
  });

  const response = await handler({
    httpMethod: 'POST',
    body: JSON.stringify({ url: 'https://example.com/air-fryer-tofu' })
  });

  const payload = JSON.parse(response.body);

  expect(response.statusCode).toBe(200);
  expect(payload.source).toBe('wprm');
  expect(payload.recipe.title).toBe('Air Fryer Tofu');
  expect(payload.recipe.prep_time_minutes).toBe(45);
  expect(payload.recipe.ingredients[0].items[1]).toMatchObject({
    amount: 0.5,
    amount_text: '1/2',
    unit: 'tablespoon',
    name: 'avocado oil',
    scalable: true
  });
  expect(payload.recipe.steps).toEqual([
    { step_number: 1, text: 'Press the tofu.', image_url: null },
    { step_number: 2, text: 'Air fry until crisp.', image_url: null }
  ]);
});

test('rejects Reddit URLs with a clear unsupported message', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch');
  const response = await handler({
    httpMethod: 'POST',
    body: JSON.stringify({
      url: 'https://www.reddit.com/r/vegetarianrecipes/comments/1r79lj2/crispy_air_fryer_tofu_recipe_korean_style/'
    })
  });

  const payload = JSON.parse(response.body);

  expect(response.statusCode).toBe(422);
  expect(payload.error).toBe('Reddit import is not currently supported.');
  expect(fetchMock).not.toHaveBeenCalled();
});
