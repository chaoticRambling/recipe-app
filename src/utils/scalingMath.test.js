import { test, expect } from 'vitest';
import {
  canScaleIngredient,
  formatIngredientParts,
  hasUnscaledIngredients,
  normalizeAndScale,
  parseStrictNumber,
  shouldFlagUnscaledIngredient
} from './scalingMath';

test('parses simple numeric and fraction amounts as scalable numbers', () => {
  expect(parseStrictNumber(2)).toBe(2);
  expect(parseStrictNumber('2.5')).toBe(2.5);
  expect(parseStrictNumber('1/2')).toBe(0.5);
  expect(parseStrictNumber('1 / 3')).toBeCloseTo(1 / 3);
  expect(parseStrictNumber('1 1/2')).toBe(1.5);
  expect(parseStrictNumber('')).toBeNull();
  expect(parseStrictNumber('1 to 2')).toBeNull();
  expect(parseStrictNumber(null)).toBeNull();
});

test('scales numeric ingredients without converting units', () => {
  expect(normalizeAndScale({ amount: 4, unit: 'clove', name: 'garlic' }, 0.5))
    .toMatchObject({ amount: 2, amount_text: '2', unit: 'clove', name: 'garlic' });

  expect(normalizeAndScale({ amount: 3, unit: 'tsp', name: 'water' }, 2))
    .toMatchObject({ amount: 6, amount_text: '6', unit: 'tsp', name: 'water' });
});

test('scales numeric amounts with blank or custom units', () => {
  expect(formatIngredientParts({ amount: 2, unit: '', name: 'eggs' }, 2))
    .toEqual({ quantity: '4', name: 'eggs' });

  expect(formatIngredientParts({ amount: 2, unit: 'sprigs', name: 'thyme' }, 2))
    .toEqual({ quantity: '4 sprigs', name: 'thyme' });
});

test('scales fractions and keeps fraction display text', () => {
  expect(normalizeAndScale({
    amount: 0.5,
    amount_text: '1/2',
    unit: 'cup',
    name: 'milk'
  }, 1)).toMatchObject({ amount: 0.5, amount_text: '1/2', unit: 'cup', name: 'milk' });

  expect(formatIngredientParts({
    amount: 0.5,
    amount_text: '1/2',
    unit: 'cup',
    name: 'milk'
  }, 2)).toEqual({ quantity: '1 cup', name: 'milk' });

  expect(formatIngredientParts({
    amount: 1 / 3,
    amount_text: '1/3',
    unit: 'cup',
    name: 'sugar'
  }, 2)).toEqual({ quantity: '2/3 cup', name: 'sugar' });

  expect(formatIngredientParts({
    amount: 1.5,
    amount_text: '1 1/2',
    unit: 'tbsp',
    name: 'butter'
  }, 0.5)).toEqual({ quantity: '3/4 tbsp', name: 'butter' });
});

test('scales imported fractions even when only amount_text is present', () => {
  expect(formatIngredientParts({
    amount: null,
    amount_text: '1/2',
    unit: 'tsp',
    name: 'salt'
  }, 2)).toEqual({ quantity: '1 tsp', name: 'salt' });
});

test('preserves range-style amount text without scaling', () => {
  const ingredient = {
    amount: null,
    amount_text: '1 to 2',
    unit: 'tbsp',
    name: 'olive oil',
    scalable: false
  };

  expect(canScaleIngredient(ingredient)).toBe(false);
  expect(normalizeAndScale(ingredient, 2))
    .toMatchObject({ amount: null, amount_text: '1 to 2', unit: 'tbsp', name: 'olive oil' });
  expect(formatIngredientParts(ingredient, 2))
    .toEqual({ quantity: '1 to 2 tbsp', name: 'olive oil' });
});

test('renders name-only ingredients safely', () => {
  expect(formatIngredientParts({
    amount: null,
    amount_text: '',
    unit: '',
    name: 'salt to taste',
    scalable: false
  }, 2)).toEqual({ quantity: '', name: 'salt to taste' });

  expect(formatIngredientParts({
    amount: null,
    amount_text: '',
    unit: 'tbsp',
    name: 'olive oil',
    scalable: false
  }, 2)).toEqual({ quantity: '', name: 'olive oil' });
});

test('reports unscaled ingredients only when multiplier changes', () => {
  const sections = [
    {
      section_name: 'Main',
      items: [
        { amount: 2, unit: '', name: 'eggs' },
        { amount: null, amount_text: '', unit: '', name: 'salt to taste', scalable: false }
      ]
    }
  ];

  expect(hasUnscaledIngredients(sections, 1)).toBe(false);
  expect(hasUnscaledIngredients(sections, 2)).toBe(true);
});

test('flags individual unscaled ingredients only after scaling is requested', () => {
  const scalable = { amount: 2, unit: '', name: 'eggs' };
  const unscalable = {
    amount: null,
    amount_text: '1 to 2',
    unit: 'tbsp',
    name: 'olive oil',
    scalable: false
  };

  expect(shouldFlagUnscaledIngredient(unscalable, 1)).toBe(false);
  expect(shouldFlagUnscaledIngredient(unscalable, 2)).toBe(true);
  expect(shouldFlagUnscaledIngredient(scalable, 2)).toBe(false);
});
