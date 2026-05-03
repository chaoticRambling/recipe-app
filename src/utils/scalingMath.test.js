import { test, expect } from 'vitest';
import { normalizeAndScale } from './scalingMath';

test('scales discrete units correctly', () => {
  expect(normalizeAndScale({ amount: 4, unit: 'clove', name: 'garlic' }, 0.5))
    .toEqual({ amount: 2, unit: 'clove', name: 'garlic' });
    
  expect(normalizeAndScale({ amount: 1, unit: 'pinch', name: 'salt' }, 2))
    .toEqual({ amount: 2, unit: 'pinch', name: 'salt' });
});

test('scales and upgrades volume', () => {
  // 6 tsp = 1 fl oz
  expect(normalizeAndScale({ amount: 6, unit: 'tsp', name: 'sugar' }, 1))
    .toEqual({ amount: 1, unit: 'fl oz', name: 'sugar' });
  
  // 3 tsp = 1 tbsp
  expect(normalizeAndScale({ amount: 3, unit: 'tsp', name: 'water' }, 1))
    .toEqual({ amount: 1, unit: 'tbsp', name: 'water' });

  // 16 tbsp = 48 tsp = 1 cup
  expect(normalizeAndScale({ amount: 16, unit: 'tbsp', name: 'milk' }, 1))
    .toEqual({ amount: 1, unit: 'cup', name: 'milk' });
    
  // 2 pt = 1 qt
  expect(normalizeAndScale({ amount: 2, unit: 'pt', name: 'broth' }, 1))
    .toEqual({ amount: 1, unit: 'qt', name: 'broth' });
});

test('scales and degrades volume', () => {
  // 0.125 cup = 6 tsp = 1 fl oz
  expect(normalizeAndScale({ amount: 1, unit: 'cup', name: 'milk' }, 0.125))
    .toEqual({ amount: 1, unit: 'fl oz', name: 'milk' });
    
  // 0.5 fl oz = 3 tsp = 1 tbsp
  expect(normalizeAndScale({ amount: 1, unit: 'fl oz', name: 'vinegar' }, 0.5))
    .toEqual({ amount: 1, unit: 'tbsp', name: 'vinegar' });
});

test('scales weight units', () => {
  // 8 oz * 2 = 16 oz = 1 lb
  expect(normalizeAndScale({ amount: 8, unit: 'oz', name: 'flour' }, 2))
    .toEqual({ amount: 1, unit: 'lb', name: 'flour' });
    
  // 1 lb * 0.5 = 0.5 lb = 8 oz
  expect(normalizeAndScale({ amount: 1, unit: 'lb', name: 'beef' }, 0.5))
    .toEqual({ amount: 8, unit: 'oz', name: 'beef' });
    
  // 1000 g approx 2.2 lb
  expect(normalizeAndScale({ amount: 1000, unit: 'g', name: 'sugar' }, 1).unit)
    .toBe('lb');
});
