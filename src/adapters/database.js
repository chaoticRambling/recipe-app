/**
 * database.js
 * Adapter for database operations. Currently uses mock data.
 * Adheres to the recipes table schema.
 */

const mockRecipe = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  title: "Classic Garlic Oil Pasta",
  prep_time_minutes: 20,
  cuisine_type: "Italian",
  notes: "A simple and delicious aglio e olio.",
  ingredients: [
    {
      section_name: "The Garlic Oil",
      items: [
        { amount: 0.5, unit: "cup", name: "extra virgin olive oil" },
        { amount: 4, unit: "clove", name: "garlic" },
        { amount: 1, unit: "pinch", name: "red pepper flakes" }
      ]
    },
    {
      section_name: "The Pasta",
      items: [
        { amount: 1, unit: "lb", name: "spaghetti" },
        { amount: 2, unit: "tbsp", name: "kosher salt" },
        { amount: 0.25, unit: "cup", name: "fresh parsley" }
      ]
    }
  ],
  steps: [
    { 
      step_number: 1, 
      text: "Boil heavily salted water and cook spaghetti until al dente.", 
      image_url: "https://example.com/boil.jpg" 
    },
    { 
      step_number: 2, 
      text: "While pasta cooks, heat olive oil in a large skillet over medium-low heat. Add sliced garlic and cook gently until golden brown.", 
      image_url: "https://example.com/garlic.jpg" 
    },
    { 
      step_number: 3, 
      text: "Stir in red pepper flakes and remove from heat.", 
      image_url: null 
    },
    {
      step_number: 4,
      text: "Drain pasta, reserving 1/2 cup of pasta water. Toss pasta in the garlic oil, adding pasta water as needed to create an emulsion. Garnish with parsley.",
      image_url: "https://example.com/toss.jpg"
    }
  ],
  attachments: [
    { 
      file_name: "original_cookbook_scan.pdf", 
      file_url: "https://example.com/scan.pdf" 
    }
  ],
  is_draft: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const getRecipe = async (id) => {
  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const found = mockRecipesList.find(r => r.id === id);
      if (found) {
        resolve({
          ...mockRecipe,
          ...found
        });
      } else {
        resolve(null);
      }
    }, 500);
  });
};

export const updateRecipe = async (id, data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const index = mockRecipesList.findIndex(r => r.id === id);
      if (index !== -1) {
        mockRecipesList[index] = { ...mockRecipesList[index], ...data };
      }
      resolve({ id, ...data });
    }, 500);
  });
};

export const createRecipe = async (data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newId = Math.random().toString(36).substr(2, 9);
      const newRecipe = { id: newId, ...data };
      mockRecipesList.push(newRecipe);
      resolve(newRecipe);
    }, 500);
  });
};

export const deleteRecipe = async (id) => {
  console.log('Mock delete recipe:', id);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 500);
  });
};

const mockRecipesList = [
  {
    id: "123e4567-e89b-12d3-a456-426614174000",
    title: "Classic Garlic Oil Pasta",
    prep_time_minutes: 20,
    cuisine_type: "Italian",
  },
  {
    id: "223e4567-e89b-12d3-a456-426614174001",
    title: "Spicy Beef Tacos",
    prep_time_minutes: 30,
    cuisine_type: "Mexican",
  },
  {
    id: "323e4567-e89b-12d3-a456-426614174002",
    title: "Chicken Tikka Masala",
    prep_time_minutes: 45,
    cuisine_type: "Indian",
  },
  {
    id: "423e4567-e89b-12d3-a456-426614174003",
    title: "Avocado Toast with Egg",
    prep_time_minutes: 10,
    cuisine_type: "American",
  },
  {
    id: "523e4567-e89b-12d3-a456-426614174004",
    title: "Miso Ramen",
    prep_time_minutes: 60,
    cuisine_type: "Japanese",
  }
];

export const getRecipes = async () => {
  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockRecipesList);
    }, 500);
  });
};
