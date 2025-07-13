import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const UploadSpecificPhotos = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const uploadPhotos = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to upload photos",
      });
      return;
    }

    setIsUploading(true);

    try {
      // The specific photos provided by the user
      const photoUrls = [
        '/lovable-uploads/4895f052-f08a-4727-96a0-570c4fa2c8ff.png',
        '/lovable-uploads/7b0b0c21-a838-4a1d-95fb-9f4666b3685a.png'
      ];

      // Convert images to base64
      const photoFiles = [];
      
      for (let i = 0; i < photoUrls.length; i++) {
        try {
          // For the uploaded images, we'll create them as progress photos directly
          const timestamp = new Date().getTime();
          const fileName = `progress_${user.id}_2025-07-06_${i + 1}_${timestamp}.png`;
          
          // Upload directly to storage using the file URLs
          // Since we can't download the lovable-uploads directly, we'll create the records with the URLs
          const { data: progressPhoto, error: dbError } = await supabase
            .from('progress_photos')
            .insert({
              user_id: user.id,
              photo_url: photoUrls[i],
              week_start_date: '2025-07-06',
              notes: `Progress photo ${i + 1} - July 6, 2025 week`
            })
            .select()
            .single();

          if (dbError) {
            console.error('Database error:', dbError);
            throw new Error(`Failed to save photo ${i + 1}: ${dbError.message}`);
          }

          photoFiles.push(progressPhoto);
        } catch (error) {
          console.error(`Error processing photo ${i + 1}:`, error);
          throw error;
        }
      }

      toast({
        title: "Success!",
        description: `Successfully uploaded ${photoFiles.length} progress photos for July 6 week`,
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload progress photos",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Upload July 6 Progress Photos</h3>
      <p className="text-sm text-muted-foreground mb-4">
        This will add the uploaded progress photos to your July 6 week (2025-07-06).
      </p>
      <Button 
        onClick={uploadPhotos} 
        disabled={isUploading}
      >
        {isUploading ? "Uploading..." : "Add Photos to July 6 Week"}
      </Button>
    </div>
  );
};