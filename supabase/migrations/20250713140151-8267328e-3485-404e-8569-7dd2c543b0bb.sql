-- Check if progress-photos bucket exists and make sure it's accessible
DO $$
BEGIN
  -- Check if the bucket exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'progress-photos') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('progress-photos', 'progress-photos', true);
  ELSE
    -- Update existing bucket to be public
    UPDATE storage.buckets SET public = true WHERE id = 'progress-photos';
  END IF;
END $$;

-- Create or update policies for public access to progress photos
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Public access to progress photos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload progress photos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view progress photos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their progress photos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their progress photos" ON storage.objects;
END $$;

-- Create new policies for progress photos
CREATE POLICY "Anyone can view progress photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'progress-photos');

CREATE POLICY "Users can upload their progress photos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their progress photos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their progress photos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);