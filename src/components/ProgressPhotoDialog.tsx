import { useState } from 'react';
import { Camera, Upload, X, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ProgressPhotoDialogProps {
  onPhotoUploaded: () => void;
}

export const ProgressPhotoDialog = ({ onPhotoUploaded }: ProgressPhotoDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const getWeekStartDate = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    return startOfWeek.toISOString().split('T')[0];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload an image file.",
        });
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload an image smaller than 10MB.",
        });
        return;
      }

      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!user || !file) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select an image to upload.",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload file to storage
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName);

      // Save photo info to database
      const { error: dbError } = await supabase
        .from('progress_photos')
        .insert({
          user_id: user.id,
          photo_url: publicUrl,
          week_start_date: getWeekStartDate(),
          notes: notes.trim() || null,
        });

      if (dbError) throw dbError;

      toast({
        title: "Progress photo uploaded!",
        description: "Your progress photo has been saved for this week.",
      });

      setOpen(false);
      setFile(null);
      setPreview(null);
      setNotes('');
      onPhotoUploaded();
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

  const removeFile = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
          <Camera className="h-6 w-6" />
          <span>Progress Photo</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Progress Photo</DialogTitle>
          <DialogDescription>
            Upload a photo to track your fitness progress for the week of {new Date().toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Photo</Label>
            {preview ? (
              <div className="space-y-3">
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {file?.name} ({file ? (file.size / 1024 / 1024).toFixed(2) : 0} MB)
                </p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted rounded-md p-6 text-center">
                <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Image files only, max 10MB
                  </p>
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about your progress, weight, measurements, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Photo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};