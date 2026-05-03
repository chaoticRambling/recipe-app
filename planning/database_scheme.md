# Database Schema: `recipes` Table

- `id` (UUID, Primary Key)
- `title` (Text)
- `prep_time_minutes` (Integer)
- `cuisine_type` (Text)
- `notes` (Text)
- `ingredients` (JSONB)
- `steps` (JSONB)
- `attachments` (JSONB)
- `is_draft` (Boolean, default: false)
- `created_at` (Timestampz)
- `updated_at` (Timestampz)

## JSONB Structures

### Ingredients (Structured with Sections)
[
  {
    "section_name": "The Garlic Oil",
    "items": [
      { "amount": 0.5, "unit": "cup", "name": "extra virgin olive oil" },
      { "amount": 4, "unit": "clove", "name": "garlic" }
    ]
  }
]

### Steps (Ordered Array)
[
  { 
    "step_number": 1, 
    "text": "Blend until smooth.", 
    "image_url": "https://..." 
  }
]

### Attachments
[
  { 
    "file_name": "original_cookbook_scan.pdf", 
    "file_url": "https://..." 
  }
]