export async function importRecipeFromUrl(url) {
  const response = await fetch('/.netlify/functions/import-recipe-url', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Recipe import failed.');
  }

  return payload;
}
