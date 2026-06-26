-- Create the vendor-uploads storage bucket for image uploads
-- Run this in Supabase SQL Editor

-- Create the bucket (public so images can be served via URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-uploads', 'vendor-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vendor-uploads');

-- Allow public read access to uploaded files
CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'vendor-uploads');

-- Allow users to delete their own uploads
CREATE POLICY "Allow users to delete own uploads" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'vendor-uploads' AND owner = auth.uid());
