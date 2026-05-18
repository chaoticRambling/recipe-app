export async function importRecipeFromUrl(url) {
  const response = await fetch('/.netlify/functions/import-recipe-url', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url })
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Recipe import endpoint returned an unexpected response. Restart the dev server and try again.');
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Recipe import failed.');
  }

  return payload;
}
