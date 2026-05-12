const OPENAI_MODEL = process.env.OPENAI_RECIPE_IMPORT_MODEL || 'gpt-5-nano';
const MAX_PAGE_TEXT_CHARS = 24000;

const RECIPE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'prep_time_minutes', 'cuisine_type', 'notes', 'ingredients', 'steps'],
  properties: {
    title: { type: 'string' },
    prep_time_minutes: { type: 'number' },
    cuisine_type: { type: 'string' },
    notes: { type: 'string' },
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['section_name', 'items'],
        properties: {
          section_name: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['amount', 'amount_text', 'unit', 'name', 'original_text', 'scalable'],
              properties: {
                amount: { type: ['number', 'null'] },
                amount_text: { type: 'string' },
                unit: { type: 'string' },
                name: { type: 'string' },
                original_text: { type: 'string' },
                scalable: { type: 'boolean' }
              }
            }
          }
        }
      }
    },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['step_number', 'text', 'image_url'],
        properties: {
          step_number: { type: 'number' },
          text: { type: 'string' },
          image_url: { type: ['string', 'null'] }
        }
      }
    }
  }
};

const VULGAR_FRACTIONS = {
  '¼': '1/4',
  '½': '1/2',
  '¾': '3/4',
  '⅐': '1/7',
  '⅑': '1/9',
  '⅒': '1/10',
  '⅓': '1/3',
  '⅔': '2/3',
  '⅕': '1/5',
  '⅖': '2/5',
  '⅗': '3/5',
  '⅘': '4/5',
  '⅙': '1/6',
  '⅚': '5/6',
  '⅛': '1/8',
  '⅜': '3/8',
  '⅝': '5/8',
  '⅞': '7/8'
};

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  };
}

function normalizeFractionGlyphs(value) {
  return String(value || '').replace(/[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, match => ` ${VULGAR_FRACTIONS[match]}`);
}

function parseAmount(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const trimmed = normalizeFractionGlyphs(value).trim();
  if (!trimmed) return null;

  const mixed = trimmed.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const numerator = Number(mixed[2]);
    const denominator = Number(mixed[3]);
    if (denominator === 0) return null;
    return whole < 0 ? whole - numerator / denominator : whole + numerator / denominator;
  }

  const fraction = trimmed.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    if (denominator === 0) return null;
    return numerator / denominator;
  }

  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/');
}

function stripHtml(html) {
  return decodeHtmlEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findRecipeJsonLd(value) {
  if (!value || typeof value !== 'object') return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const recipe = findRecipeJsonLd(item);
      if (recipe) return recipe;
    }
    return null;
  }

  const type = value['@type'];
  const types = Array.isArray(type) ? type : [type];
  if (types.some(item => String(item).toLowerCase() === 'recipe')) {
    return value;
  }

  if (Array.isArray(value['@graph'])) {
    return findRecipeJsonLd(value['@graph']);
  }

  return null;
}

function extractJsonLdRecipe(html) {
  const matches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

  for (const match of matches) {
    const rawJson = decodeHtmlEntities(match[1].trim());
    try {
      const parsed = JSON.parse(rawJson);
      const recipe = findRecipeJsonLd(parsed);
      if (recipe) return recipe;
    } catch (error) {
      console.warn('Failed to parse JSON-LD recipe block:', error.message);
    }
  }

  return null;
}

function extractAssignedObjectLiteral(html, assignmentName) {
  const assignmentIndex = html.indexOf(assignmentName);
  if (assignmentIndex === -1) return null;

  const objectStart = html.indexOf('{', assignmentIndex);
  if (objectStart === -1) return null;

  let depth = 0;
  let inString = false;
  let stringQuote = '';
  let isEscaped = false;

  for (let index = objectStart; index < html.length; index += 1) {
    const char = html[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === '\\') {
        isEscaped = true;
      } else if (char === stringQuote) {
        inString = false;
        stringQuote = '';
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      stringQuote = char;
      continue;
    }

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return html.slice(objectStart, index + 1);
      }
    }
  }

  return null;
}

function extractWprmRecipes(html) {
  const rawJson = extractAssignedObjectLiteral(html, 'window.wprm_recipes');
  if (!rawJson) return null;

  try {
    const parsed = JSON.parse(rawJson);
    return Object.values(parsed || {});
  } catch (error) {
    console.warn('Failed to parse WP Recipe Maker data:', error.message);
    return null;
  }
}

function firstText(value) {
  if (Array.isArray(value)) return firstText(value[0]);
  if (value && typeof value === 'object') return value.url || value.name || '';
  return String(value || '');
}

function parseDurationMinutes(value) {
  if (!value) return 0;
  const text = String(value);
  const iso = text.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/i);
  if (iso) {
    const days = Number(iso[1] || 0);
    const hours = Number(iso[2] || 0);
    const minutes = Number(iso[3] || 0);
    return days * 24 * 60 + hours * 60 + minutes;
  }

  const number = text.match(/\d+/);
  return number ? Number(number[0]) : 0;
}

function instructionText(step) {
  if (!step) return '';
  if (typeof step === 'string') return step;
  if (Array.isArray(step.itemListElement)) {
    return step.itemListElement.map(instructionText).filter(Boolean).join(' ');
  }
  return step.text || step.name || '';
}

function normalizeInstructions(recipe) {
  const instructions = Array.isArray(recipe.recipeInstructions)
    ? recipe.recipeInstructions
    : [recipe.recipeInstructions].filter(Boolean);

  return instructions
    .map(instructionText)
    .filter(Boolean)
    .map((text, index) => ({
      step_number: index + 1,
      text: String(text).trim(),
      image_url: null
    }));
}

function extractWprmInstructions(html) {
  const matches = html.matchAll(/<div[^>]*class=(?:"[^"]*\bwprm-recipe-instruction-text\b[^"]*"|'[^']*\bwprm-recipe-instruction-text\b[^']*'|[^\s>]*\bwprm-recipe-instruction-text\b[^\s>]*)[^>]*>([\s\S]*?)<\/div>/gi);

  return Array.from(matches)
    .map(match => stripHtml(match[1]))
    .filter(Boolean)
    .map((text, index) => ({
      step_number: index + 1,
      text,
      image_url: null
    }));
}

function extractWprmTotalMinutes(html) {
  const totalTimeMatch = html.match(/wprm-recipe-total-time-container[\s\S]{0,600}?wprm-recipe-total_time-minutes[^>]*>(\d+)/i);
  if (totalTimeMatch) return Number(totalTimeMatch[1]) || 0;

  const prepMatch = html.match(/wprm-recipe-prep-time-container[\s\S]{0,600}?wprm-recipe-prep_time-minutes[^>]*>(\d+)/i);
  const cookMatch = html.match(/wprm-recipe-cook-time-container[\s\S]{0,600}?wprm-recipe-cook_time-minutes[^>]*>(\d+)/i);
  return (Number(prepMatch?.[1]) || 0) + (Number(cookMatch?.[1]) || 0);
}

function parseIngredientLine(line) {
  const originalText = normalizeFractionGlyphs(line).replace(/\s+/g, ' ').trim();
  const leadingAmount = originalText.match(/^((?:\d+\s+)?\d+\s*\/\s*\d+|\d+(?:\.\d+)?)(?:\s+|$)(.*)$/);

  if (!leadingAmount) {
    return {
      amount: null,
      amount_text: '',
      unit: '',
      name: originalText,
      original_text: originalText,
      scalable: false
    };
  }

  const amountText = leadingAmount[1].replace(/\s*\/\s*/g, '/').trim();
  const remainder = leadingAmount[2].trim();
  const parts = remainder.split(/\s+/);
  const unit = parts.length > 1 ? parts[0] : '';
  const name = parts.length > 1 ? parts.slice(1).join(' ') : remainder;
  const amount = parseAmount(amountText);

  return {
    amount,
    amount_text: amountText,
    unit,
    name,
    original_text: originalText,
    scalable: amount !== null
  };
}

function normalizeWprmIngredient(item) {
  const amountText = normalizeFractionGlyphs(item.amount || '').replace(/\s*\/\s*/g, '/').trim();
  const amount = parseAmount(amountText);
  const unit = String(item.unit || '').trim();
  const name = [item.name, item.notes].filter(Boolean).join(', ').trim();
  const originalText = [amountText, unit, name].filter(Boolean).join(' ');

  return {
    amount,
    amount_text: amountText,
    unit,
    name,
    original_text: originalText,
    scalable: amount !== null
  };
}

function normalizeRecipeFromJsonLd(recipe, sourceUrl) {
  const ingredients = Array.isArray(recipe.recipeIngredient)
    ? recipe.recipeIngredient
    : [recipe.recipeIngredient].filter(Boolean);

  const prepMinutes = parseDurationMinutes(recipe.prepTime);
  const cookMinutes = parseDurationMinutes(recipe.cookTime);
  const totalMinutes = parseDurationMinutes(recipe.totalTime);

  return {
    title: String(recipe.name || 'Imported Recipe').trim(),
    prep_time_minutes: totalMinutes || prepMinutes + cookMinutes || 0,
    cuisine_type: Array.isArray(recipe.recipeCuisine)
      ? recipe.recipeCuisine.join(', ')
      : String(recipe.recipeCuisine || ''),
    notes: sourceUrl ? `Imported from ${sourceUrl}` : '',
    ingredients: [
      {
        section_name: 'Main',
        items: ingredients.map(parseIngredientLine)
      }
    ],
    steps: normalizeInstructions(recipe),
    draft_ingredients: ingredients.join('\n'),
    draft_steps: normalizeInstructions(recipe).map(step => step.text).join('\n\n'),
    image_url: firstText(recipe.image)
  };
}

function normalizeRecipeFromWprm(recipe, html, sourceUrl) {
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const steps = extractWprmInstructions(html);

  return {
    title: String(recipe.name || 'Imported Recipe').trim(),
    prep_time_minutes: extractWprmTotalMinutes(html),
    cuisine_type: '',
    notes: sourceUrl ? `Imported from ${sourceUrl}` : '',
    ingredients: [
      {
        section_name: 'Main',
        items: ingredients.map(normalizeWprmIngredient)
      }
    ],
    steps,
    draft_ingredients: ingredients.map(item => normalizeWprmIngredient(item).original_text).filter(Boolean).join('\n'),
    draft_steps: steps.map(step => step.text).join('\n\n'),
    image_url: recipe.image_url || ''
  };
}

function normalizeLlmRecipe(recipe, pageText, sourceUrl) {
  const ingredients = Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0
    ? recipe.ingredients
    : [{ section_name: 'Main', items: [] }];

  return {
    title: String(recipe.title || 'Imported Recipe').trim(),
    prep_time_minutes: Number(recipe.prep_time_minutes) || 0,
    cuisine_type: String(recipe.cuisine_type || ''),
    notes: recipe.notes || (sourceUrl ? `Imported from ${sourceUrl}` : ''),
    ingredients: ingredients.map(section => ({
      section_name: section.section_name || 'Main',
      items: (section.items || []).map(item => {
        const amount = parseAmount(item.amount_text) ?? parseAmount(item.amount);
        return {
          amount,
          amount_text: item.amount_text || (amount !== null ? String(item.amount) : ''),
          unit: item.unit || '',
          name: item.name || item.original_text || '',
          original_text: item.original_text || [item.amount_text, item.unit, item.name].filter(Boolean).join(' '),
          scalable: item.scalable !== false && amount !== null
        };
      })
    })),
    steps: (recipe.steps || []).map((step, index) => ({
      step_number: Number(step.step_number) || index + 1,
      text: String(step.text || '').trim(),
      image_url: step.image_url || null
    })).filter(step => step.text),
    draft_ingredients: ingredients.flatMap(section => section.items || []).map(item => item.original_text || '').filter(Boolean).join('\n'),
    draft_steps: (recipe.steps || []).map(step => step.text || '').filter(Boolean).join('\n\n'),
    image_url: ''
  };
}

async function parseRecipeWithOpenAI(pageText, sourceUrl) {
  if (!process.env.OPENAI_API_KEY) return null;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: 'system',
          content: [
            'Extract one recipe from webpage text and return JSON matching the provided schema.',
            'For ingredient ranges like "1 to 2 tbsp", set amount null, amount_text "1 to 2", unit "tbsp", name without quantity, scalable false.',
            'For fractions like "1/2 cup", set amount 0.5, amount_text "1/2", unit "cup", scalable true.',
            'Keep ingredient preparation details in the name field.'
          ].join(' ')
        },
        {
          role: 'user',
          content: `Source URL: ${sourceUrl}\n\nWebpage text:\n${pageText.slice(0, MAX_PAGE_TEXT_CHARS)}`
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'recipe_import',
          strict: true,
          schema: RECIPE_SCHEMA
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI parse failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  const outputText = result.output_text
    || result.output?.flatMap(item => item.content || [])
      .find(content => content.type === 'output_text')?.text;

  if (!outputText) {
    throw new Error('OpenAI response did not include structured recipe output.');
  }

  return normalizeLlmRecipe(JSON.parse(outputText), pageText, sourceUrl);
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  let url;
  try {
    ({ url } = JSON.parse(event.body || '{}'));
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body.' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return jsonResponse(400, { error: 'Enter a valid recipe URL.' });
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return jsonResponse(400, { error: 'Recipe URL must start with http or https.' });
  }

  try {
    const pageResponse = await fetch(parsedUrl.toString(), {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'RecipeImporter/1.0'
      }
    });

    if (!pageResponse.ok) {
      return jsonResponse(422, { error: `Could not fetch recipe page: ${pageResponse.status}` });
    }

    const html = await pageResponse.text();
    const jsonLdRecipe = extractJsonLdRecipe(html);

    if (jsonLdRecipe) {
      return jsonResponse(200, {
        recipe: normalizeRecipeFromJsonLd(jsonLdRecipe, parsedUrl.toString()),
        source: 'json-ld'
      });
    }

    const wprmRecipes = extractWprmRecipes(html);
    if (wprmRecipes?.length) {
      return jsonResponse(200, {
        recipe: normalizeRecipeFromWprm(wprmRecipes[0], html, parsedUrl.toString()),
        source: 'wprm'
      });
    }

    const pageText = stripHtml(html);
    const llmRecipe = await parseRecipeWithOpenAI(pageText, parsedUrl.toString());

    if (!llmRecipe) {
      return jsonResponse(422, {
        error: 'No schema.org recipe data found. Add OPENAI_API_KEY to enable LLM fallback parsing.'
      });
    }

    return jsonResponse(200, {
      recipe: llmRecipe,
      source: 'openai'
    });
  } catch (error) {
    console.error(error);
    return jsonResponse(500, { error: error.message || 'Recipe import failed.' });
  }
};
