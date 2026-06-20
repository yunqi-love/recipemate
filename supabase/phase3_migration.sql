-- Phase 3 Migration — Run this in Supabase SQL Editor
-- Adds: cooking journal, custom recipes, decrease cooked count support

-- 1. Per-cook journal: photo + notes for each time user cooks
CREATE TABLE cooking_journal (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id  TEXT NOT NULL,
  photo_url  TEXT,
  notes      TEXT,
  cooked_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE cooking_journal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Journal is private" ON cooking_journal
  FOR ALL USING (auth.uid() = user_id);

-- 2. Custom recipes created by users
CREATE TABLE custom_recipes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  difficulty  TEXT DEFAULT '中等' CHECK (difficulty IN ('简单','中等','困难')),
  cook_time   INT DEFAULT 20,
  image_url   TEXT,
  ingredients JSONB DEFAULT '[]',
  steps       JSONB DEFAULT '[]',
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE custom_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Custom recipes are private" ON custom_recipes
  FOR ALL USING (auth.uid() = user_id);

-- 3. Allow user_cooked count to be decreased (remove CHECK if any)
-- No schema change needed — just app logic now allows decrement
