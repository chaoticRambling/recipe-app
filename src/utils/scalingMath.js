export function normalizeAndScale(ingredient, multiplier) {
  const { amount, unit, name } = ingredient;
  const newAmount = amount * multiplier;
  
  const volumeUnits = ['tsp', 'tbsp', 'fl oz', 'cup', 'pt', 'qt'];
  const weightUnits = ['g', 'oz', 'lb'];
  
  if (volumeUnits.includes(unit)) {
    return formatVolume(amount, unit, multiplier, name);
  } else if (weightUnits.includes(unit)) {
    return formatWeight(amount, unit, multiplier, name);
  } else {
    // discrete or unhandled
    return {
      amount: Math.round(newAmount * 100) / 100,
      unit: unit,
      name: name
    };
  }
}

function formatVolume(amount, unit, multiplier, name) {
  const toTsp = {
    'tsp': 1,
    'tbsp': 3,
    'fl oz': 6,
    'cup': 48,
    'pt': 96,
    'qt': 192
  };
  
  const totalTsp = amount * toTsp[unit] * multiplier;
  
  // Find the largest unit that results in >= 1 amount, or stick to the smallest if less than 1
  let finalUnit = 'tsp';
  let finalAmount = totalTsp;
  
  if (totalTsp >= 192) {
    finalUnit = 'qt';
    finalAmount = totalTsp / 192;
  } else if (totalTsp >= 96) {
    finalUnit = 'pt';
    finalAmount = totalTsp / 96;
  } else if (totalTsp >= 48) {
    finalUnit = 'cup';
    finalAmount = totalTsp / 48;
  } else if (totalTsp >= 6) {
    // A half cup is 24 tsp, which is 4 fl oz. Often people prefer 1/2 cup to 4 fl oz, 
    // but strict mathematical logic maps 24 tsp -> 4 fl oz.
    // We will stick to the strictly largest unit for simplicity, as per spec.
    finalUnit = 'fl oz';
    finalAmount = totalTsp / 6;
  } else if (totalTsp >= 3) {
    finalUnit = 'tbsp';
    finalAmount = totalTsp / 3;
  }
  
  return {
    amount: Math.round(finalAmount * 100) / 100,
    unit: finalUnit,
    name: name
  };
}

function formatWeight(amount, unit, multiplier, name) {
  const toG = {
    'g': 1,
    'oz': 28.3495,
    'lb': 453.592
  };
  
  const totalG = amount * toG[unit] * multiplier;
  
  let finalUnit = 'g';
  let finalAmount = totalG;
  
  if (totalG >= 453.592) {
    finalUnit = 'lb';
    finalAmount = totalG / 453.592;
  } else if (totalG >= 28.3495) {
    finalUnit = 'oz';
    finalAmount = totalG / 28.3495;
  }
  
  return {
    amount: Math.round(finalAmount * 100) / 100,
    unit: finalUnit,
    name: name
  };
}
