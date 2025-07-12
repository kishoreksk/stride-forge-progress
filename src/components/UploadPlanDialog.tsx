import { useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface UploadPlanDialogProps {
  onPlanUploaded: () => void;
}

export const UploadPlanDialog = ({ onPlanUploaded }: UploadPlanDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [planName, setPlanName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload a PDF file.",
        });
        return;
      }
      setFile(selectedFile);
      if (!planName) {
        setPlanName(selectedFile.name.replace('.pdf', ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!user || !file || !planName.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide a plan name and select a file.",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload file to storage
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('workout-plans')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('workout-plans')
        .getPublicUrl(fileName);

      // Save plan info to database
      const { error: dbError } = await supabase
        .from('workout_plans')
        .insert({
          user_id: user.id,
          name: planName.trim(),
          file_url: publicUrl,
        });

      if (dbError) throw dbError;

      toast({
        title: "Workout plan uploaded!",
        description: "Your workout plan has been saved successfully.",
      });

      setOpen(false);
      setFile(null);
      setPlanName('');
      onPlanUploaded();
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
    setPlanName('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
          <Upload className="h-6 w-6" />
          <span>Upload Plan</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Workout Plan</DialogTitle>
          <DialogDescription>
            Upload a PDF workout plan to track your scheduled workouts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="planName">Plan Name</Label>
            <Input
              id="planName"
              placeholder="Enter workout plan name"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
            />
          </div>

          <div>
            <Label>PDF File</Label>
            {file ? (
              <div className="flex items-center justify-between p-3 border border-border rounded-md">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted rounded-md p-6 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF files only, max 10MB
                  </p>
                </div>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || !planName.trim() || isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Plan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};