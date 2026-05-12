import { afterEach, expect, test, vi } from 'vitest';
import { handler } from '../../netlify/functions/import-recipe-url.js';

afterEach(() => {
  vi.restoreAllMocks();
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
