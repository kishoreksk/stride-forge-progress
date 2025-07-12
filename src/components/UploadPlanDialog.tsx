import { useState } from 'react';
import { Upload, FileText, X, Calendar, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [useAiParsing, setUseAiParsing] = useState(true);
  const [isParsing, setIsParsing] = useState(false);

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

      // Save plan info to database only - no workout sessions created
      const { data: planData, error: dbError } = await supabase
        .from('workout_plans')
        .insert({
          user_id: user.id,
          name: planName.trim(),
          file_url: publicUrl,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      let successMessage = "Workout plan uploaded successfully!";
      let description = "You can now reference this plan when adding workouts manually.";

      // If AI parsing is enabled, try to parse the PDF
      if (useAiParsing) {
        setIsParsing(true);
        try {
          const { data: parseData, error: parseError } = await supabase.functions.invoke('parse-workout-pdf', {
            body: {
              fileUrl: publicUrl,
              planName: planName.trim(),
              userId: user.id
            }
          });

          if (parseError) throw parseError;

          if (parseData?.success) {
            successMessage = "Plan uploaded and parsed by AI!";
            description = `Created ${parseData.workoutsCreated} workouts with ${parseData.exercisesCreated} exercises automatically.`;
          }
        } catch (parseError) {
          console.error('AI parsing failed:', parseError);
          toast({
            variant: "destructive",
            title: "AI parsing failed",
            description: "Plan uploaded but AI couldn't parse exercises. You can add workouts manually.",
          });
        } finally {
          setIsParsing(false);
        }
      }

      toast({
        title: successMessage,
        description: description,
      });

      // Reset form and close dialog
      setOpen(false);
      setFile(null);
      setPlanName('');
      setUseAiParsing(true);
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

  // Removed duration confirmation and automatic exercise creation

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
            Upload a PDF workout plan. With AI parsing enabled, exercises will be automatically extracted and added to your calendar.
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

            <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
              <Checkbox
                id="aiParsing"
                checked={useAiParsing}
                onCheckedChange={(checked) => setUseAiParsing(checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="aiParsing" className="flex items-center space-x-2 cursor-pointer">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">AI-Powered Exercise Extraction</span>
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically analyze the PDF and create workout sessions in your calendar
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || !planName.trim() || isUploading || isParsing}
              >
                {isParsing ? "AI Parsing..." : isUploading ? "Uploading..." : "Upload Plan"}
              </Button>
            </div>
          </div>
      </DialogContent>
    </Dialog>
  );
};