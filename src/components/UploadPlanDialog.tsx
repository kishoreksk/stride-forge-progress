import { useState } from 'react';
import { Upload, FileText, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [showDurationStep, setShowDurationStep] = useState(false);
  const [planDuration, setPlanDuration] = useState<string>('');
  const [uploadedPlanId, setUploadedPlanId] = useState<string>('');

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

      toast({
        title: "Workout plan uploaded!",
        description: "Now select the duration for your plan.",
      });

      setUploadedPlanId(planData.id);
      setShowDurationStep(true);
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

  const handleDurationConfirm = async () => {
    if (!planDuration) {
      toast({
        variant: "destructive",
        title: "Please select duration",
        description: "Choose how many weeks this plan will run.",
      });
      return;
    }

    setIsUploading(true);

    try {
      const weeks = parseInt(planDuration);
      const startDate = new Date();
      
      // Create workout sessions for each week with sample exercises
      const sessions = [];
      for (let week = 0; week < weeks; week++) {
        // Create sessions for each day of the week (assuming 6 days training)
        const categories = ['push', 'pull', 'legs', 'push', 'pull', 'legs'];
        
        for (let day = 0; day < 6; day++) {
          const sessionDate = new Date(startDate);
          sessionDate.setDate(startDate.getDate() + (week * 7) + day);
          
          const { data: sessionData, error: sessionError } = await supabase
            .from('workout_sessions')
            .insert({
              user_id: user!.id,
              date: sessionDate.toISOString().split('T')[0],
              category: categories[day] as 'push' | 'pull' | 'legs',
              workout_plan_id: uploadedPlanId,
              duration_minutes: 60
            })
            .select()
            .single();

          if (sessionError) throw sessionError;

          // Add sample exercises based on category
          const exercises = getExercisesByCategory(categories[day]);
          
          for (const exercise of exercises) {
            await supabase
              .from('exercises')
              .insert({
                workout_session_id: sessionData.id,
                exercise_name: exercise.name,
                exercise_type: exercise.type as 'strength' | 'cardio',
                sets: exercise.sets,
                reps: exercise.reps,
                weight_kg: exercise.weight
              });
          }
        }
      }

      toast({
        title: "Plan scheduled successfully!",
        description: `Created ${weeks * 6} workout sessions with exercises.`,
      });

      setOpen(false);
      setFile(null);
      setPlanName('');
      setShowDurationStep(false);
      setPlanDuration('');
      setUploadedPlanId('');
      onPlanUploaded();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to schedule plan",
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getExercisesByCategory = (category: string) => {
    const exerciseTemplates = {
      push: [
        { name: 'Bench Press', type: 'strength', sets: 4, reps: 8, weight: 60 },
        { name: 'Shoulder Press', type: 'strength', sets: 3, reps: 10, weight: 40 },
        { name: 'Tricep Dips', type: 'strength', sets: 3, reps: 12, weight: null }
      ],
      pull: [
        { name: 'Pull-ups', type: 'strength', sets: 4, reps: 8, weight: null },
        { name: 'Barbell Rows', type: 'strength', sets: 4, reps: 10, weight: 50 },
        { name: 'Bicep Curls', type: 'strength', sets: 3, reps: 12, weight: 20 }
      ],
      legs: [
        { name: 'Squats', type: 'strength', sets: 4, reps: 10, weight: 70 },
        { name: 'Deadlifts', type: 'strength', sets: 4, reps: 8, weight: 80 },
        { name: 'Calf Raises', type: 'strength', sets: 3, reps: 15, weight: 30 }
      ]
    };
    return exerciseTemplates[category as keyof typeof exerciseTemplates] || exerciseTemplates.push;
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
          <DialogTitle>
            {showDurationStep ? 'Set Plan Duration' : 'Upload Workout Plan'}
          </DialogTitle>
          <DialogDescription>
            {showDurationStep 
              ? 'Choose how many weeks this plan will run and exercises will be automatically scheduled'
              : 'Upload a PDF workout plan to track your scheduled workouts'
            }
          </DialogDescription>
        </DialogHeader>

        {showDurationStep ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="duration">Plan Duration</Label>
              <Select value={planDuration} onValueChange={setPlanDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Weeks</SelectItem>
                  <SelectItem value="4">4 Weeks</SelectItem>
                  <SelectItem value="6">6 Weeks</SelectItem>
                  <SelectItem value="8">8 Weeks</SelectItem>
                  <SelectItem value="12">12 Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 inline mr-1" />
                This will create {planDuration ? parseInt(planDuration) * 6 : 0} workout sessions 
                (6 days per week) with pre-filled exercises based on Push/Pull/Legs split.
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowDurationStep(false);
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDurationConfirm}
                disabled={!planDuration || isUploading}
              >
                {isUploading ? "Creating Sessions..." : "Schedule Plan"}
              </Button>
            </div>
          </div>
        ) : (
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
        )}
      </DialogContent>
    </Dialog>
  );
};