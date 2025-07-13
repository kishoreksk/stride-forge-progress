-- Create storage policies for progress-photos bucket

-- Policy to allow users to view their own progress photos
CREATE POLICY "Users can view their own progress photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy to allow users to upload their own progress photos
CREATE POLICY "Users can upload their own progress photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy to allow users to update their own progress photos
CREATE POLICY "Users can update their own progress photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy to allow users to delete their own progress photos
CREATE POLICY "Users can delete their own progress photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);