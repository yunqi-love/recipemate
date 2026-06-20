-- RecipeMate v2 — Supabase Database Schema
-- Run this SQL in the Supabase SQL Editor to create all tables.

-- 1. Recipes table
CREATE TABLE recipes (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty  TEXT NOT NULL CHECK (difficulty IN ('简单','中等','困难')),
  cook_time   INT NOT NULL,
  image_url   TEXT,
  ingredients JSONB NOT NULL,   -- [{ "name": "番茄", "amount": "中等大小 2 个" }, ...]
  steps       JSONB NOT NULL,   -- [{ "num": 1, "text": "...", "detail": "中火炒约2分钟至出汁" }, ...]
  tags        TEXT[] NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. User favorites
CREATE TABLE user_favorites (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id  TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, recipe_id)
);

-- 3. User cooked records
CREATE TABLE user_cooked (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id    TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  count        INT NOT NULL DEFAULT 1,
  last_cooked  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, recipe_id)
);

-- 4. Shopping list
CREATE TABLE shopping_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  checked      BOOLEAN DEFAULT false,
  recipe_id    TEXT REFERENCES recipes(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 5. Enable Row Level Security
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cooked ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- 6. Policies: users can only access their own data; recipes are public read
CREATE POLICY "Recipes are public" ON recipes FOR SELECT USING (true);

CREATE POLICY "Favorites are private" ON user_favorites
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Cooked records are private" ON user_cooked
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Shopping items are private" ON shopping_items
  FOR ALL USING (auth.uid() = user_id);
