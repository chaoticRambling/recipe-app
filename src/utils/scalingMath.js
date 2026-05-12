export function parseStrictNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const mixedFractionMatch = trimmed.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedFractionMatch) {
    const whole = Number(mixedFractionMatch[1]);
    const numerator = Number(mixedFractionMatch[2]);
    const denominator = Number(mixedFractionMatch[3]);
    if (denominator === 0) return null;
    const fraction = numerator / denominator;
    return whole < 0 ? whole - fraction : whole + fraction;
  }

  const fractionMatch = trimmed.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (fractionMatch) {
    const numerator = Number(fractionMatch[1]);
    const denominator = Number(fractionMatch[2]);
    if (denominator === 0) return null;
    return numerator / denominator;
  }

  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function getIngredientAmount(ingredient) {
  return parseStrictNumber(ingredient?.amount) ?? parseStrictNumber(ingredient?.amount_text);
}

export function canScaleIngredient(ingredient) {
  return ingredient?.scalable !== false && getIngredientAmount(ingredient) !== null;
}

function roundAmount(value) {
  return Math.round(value * 10000) / 10000;
}

function formatAmount(value) {
  const numericAmount = parseStrictNumber(value);
  if (numericAmount === null) return '';
  return Number.isInteger(numericAmount) ? String(numericAmount) : String(numericAmount);
}

function usesFractionFormatting(ingredient) {
  return typeof ingredient?.amount_text === 'string' && ingredient.amount_text.includes('/');
}

function greatestCommonDivisor(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);

  while (y) {
    const temp = y;
    y = x % y;
    x = temp;
  }

  return x || 1;
}

function approximateFraction(value, maxDenominator = 64) {
  let bestNumerator = 0;
  let bestDenominator = 1;
  let bestDifference = Infinity;

  for (let denominator = 1; denominator <= maxDenominator; denominator += 1) {
    const numerator = Math.round(value * denominator);
    const difference = Math.abs(value - numerator / denominator);

    if (difference < bestDifference) {
      bestNumerator = numerator;
      bestDenominator = denominator;
      bestDifference = difference;
    }
  }

  const divisor = greatestCommonDivisor(bestNumerator, bestDenominator);
  return {
    numerator: bestNumerator / divisor,
    denominator: bestDenominator / divisor
  };
}

function formatFractionAmount(value) {
  const numericAmount = parseStrictNumber(value);
  if (numericAmount === null) return '';

  const sign = numericAmount < 0 ? '-' : '';
  const absoluteAmount = Math.abs(numericAmount);
  let whole = Math.floor(absoluteAmount);
  const remainder = absoluteAmount - whole;

  if (remainder < 0.0001) {
    return `${sign}${whole}`;
  }

  let { numerator, denominator } = approximateFraction(remainder);

  if (numerator === 0) {
    return `${sign}${whole}`;
  }

  if (numerator === denominator) {
    whole += 1;
    numerator = 0;
  }

  if (numerator === 0) {
    return `${sign}${whole}`;
  }

  const fractionText = `${numerator}/${denominator}`;
  return whole > 0 ? `${sign}${whole} ${fractionText}` : `${sign}${fractionText}`;
}

function formatScaledAmount(ingredient, amount) {
  return usesFractionFormatting(ingredient) ? formatFractionAmount(amount) : formatAmount(amount);
}

export function normalizeAndScale(ingredient, multiplier = 1) {
  if (!ingredient) return ingredient;

  const safeMultiplier = parseStrictNumber(multiplier) ?? 1;
  const amount = getIngredientAmount(ingredient);

  if (!canScaleIngredient(ingredient)) {
    return {
      ...ingredient,
      amount: amount,
      amount_text: ingredient.amount_text ?? formatAmount(amount),
      unit: ingredient.unit || '',
      name: ingredient.name || ''
    };
  }

  const scaledAmount = roundAmount(amount * safeMultiplier);

  return {
    ...ingredient,
    amount: scaledAmount,
    amount_text: formatScaledAmount(ingredient, scaledAmount),
    unit: ingredient.unit || '',
    name: ingredient.name || ''
  };
}

export function formatIngredientParts(ingredient, multiplier = 1) {
  if (!ingredient) {
    return { quantity: '', name: '' };
  }

  const scaled = normalizeAndScale(ingredient, multiplier);
  const amountText = canScaleIngredient(ingredient)
    ? scaled.amount_text
    : (ingredient.amount_text || formatAmount(ingredient.amount));
  const unit = scaled.unit || '';

  return {
    quantity: amountText ? [amountText, unit].filter(Boolean).join(' ') : '',
    name: scaled.name || ''
  };
}

export function hasUnscaledIngredients(sections, multiplier = 1) {
  const safeMultiplier = parseStrictNumber(multiplier) ?? 1;
  if (safeMultiplier === 1) return false;

  return (sections || []).some(section =>
    (section.items || []).some(item =>
      item && (item.name || item.original_text) && !canScaleIngredient(item)
    )
  );
}

export function shouldFlagUnscaledIngredient(ingredient, multiplier = 1) {
  const safeMultiplier = parseStrictNumber(multiplier) ?? 1;
  return safeMultiplier !== 1
    && Boolean(ingredient?.name || ingredient?.original_text)
    && !canScaleIngredient(ingredient);
}
