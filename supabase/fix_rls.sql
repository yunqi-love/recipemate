-- Fix RLS: recipe editing + image upload
-- Run in Supabase SQL Editor

-- 1. Fix custom_recipes permissions
DROP POLICY IF EXISTS "Custom recipes private" ON custom_recipes;
DROP POLICY IF EXISTS "Custom recipes are private" ON custom_recipes;
CREATE POLICY "Custom recipes private" ON custom_recipes
  FOR ALL USING (auth.uid() = user_id);

-- 2. Make sure recipe-images bucket is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Storage: allow authenticated uploads
DROP POLICY IF EXISTS "Users can upload" ON storage.objects;
CREATE POLICY "Users can upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'recipe-images' AND auth.role() = 'authenticated');

-- 4. Storage: allow public reads
DROP POLICY IF EXISTS "Anyone can view" ON storage.objects;
CREATE POLICY "Anyone can view" ON storage.objects
  FOR SELECT USING (bucket_id = 'recipe-images');
