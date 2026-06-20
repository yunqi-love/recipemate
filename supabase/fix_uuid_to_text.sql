-- Fix: Change custom_recipes.id from UUID to TEXT so built-in recipe IDs (r01, r02...) can be used
ALTER TABLE custom_recipes ALTER COLUMN id TYPE TEXT;
