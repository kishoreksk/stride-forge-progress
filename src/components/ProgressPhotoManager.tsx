import { useState } from 'react';
import { Camera, Upload, X, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ProgressPhotoManagerProps {
  weekStartDate: Date;
  onPhotoUpdate?: () => void;
}

export const ProgressPhotoManager = ({ weekStartDate, onPhotoUpdate }: ProgressPhotoManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [progressPhotos, setProgressPhotos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      fetchProgressPhotos();
    } else {
      setSelectedFile(null);
      setNotes('');
    }
  };

  const fetchProgressPhotos = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start_date', format(weekStartDate, 'yyyy-MM-dd'))
        .order('created_at', { ascending: true });

      if (error) throw error;
      setProgressPhotos(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching photos",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    } else {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please select an image file",
      });
    }
  };

  const uploadPhoto = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    try {
      // Generate unique filename
      const timestamp = new Date().getTime();
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `progress_${user.id}_${format(weekStartDate, 'yyyy-MM-dd')}_${timestamp}.${fileExt}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('progress_photos')
        .insert({
          user_id: user.id,
          photo_url: publicUrl,
          week_start_date: format(weekStartDate, 'yyyy-MM-dd'),
          notes: notes || null
        });

      if (dbError) throw dbError;

      toast({
        title: "Photo uploaded!",
        description: "Your progress photo has been saved.",
      });

      setSelectedFile(null);
      setNotes('');
      fetchProgressPhotos();
      onPhotoUpdate?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const deletePhoto = async (photoId: string, photoUrl: string) => {
    try {
      // Extract filename from URL
      const fileName = photoUrl.split('/').pop();
      
      // Delete from storage
      if (fileName) {
        await supabase.storage
          .from('progress-photos')
          .remove([fileName]);
      }

      // Delete from database
      const { error } = await supabase
        .from('progress_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      toast({
        title: "Photo deleted",
        description: "Progress photo has been removed.",
      });

      fetchProgressPhotos();
      onPhotoUpdate?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-2">
          <Camera className="h-4 w-4 mr-1" />
          Photos ({progressPhotos.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Progress Photos</DialogTitle>
          <DialogDescription>
            Manage progress photos for week of {format(weekStartDate, 'PPP')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Upload New Photo</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="photo">Select Photo</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-1"
                />
              </div>
              
              {selectedFile && (
                <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                  <Image className="h-4 w-4" />
                  <span className="text-sm">{selectedFile.name}</span>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this photo..."
                  className="mt-1"
                />
              </div>

              <Button 
                onClick={uploadPhoto} 
                disabled={!selectedFile || isUploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload Photo"}
              </Button>
            </div>
          </div>

          {/* Existing Photos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Existing Photos</h3>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : progressPhotos.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No photos for this week yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {progressPhotos.map((photo) => (
                  <div key={photo.id} className="relative">
                    <img
                      src={photo.photo_url}
                      alt="Progress photo"
                      className="w-full h-32 object-cover rounded border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={() => deletePhoto(photo.id, photo.photo_url)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    {photo.notes && (
                      <p className="text-xs text-muted-foreground mt-2 truncate">
                        {photo.notes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(photo.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
