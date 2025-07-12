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
      
      // Create workout sessions for the Kishore plan (6 days: Push, Pull, Legs, Push, Pull, Abs)
      const sessions = [];
      for (let week = 0; week < weeks; week++) {
        // Kishore plan structure: Monday-Push, Tuesday-Pull, Wednesday-Legs, Thursday-Push, Friday-Pull, Saturday-Abs
        const dailyPlan = [
          { category: 'push', dayName: 'Monday' },
          { category: 'pull', dayName: 'Tuesday' },
          { category: 'legs', dayName: 'Wednesday' },
          { category: 'push', dayName: 'Thursday' },
          { category: 'pull', dayName: 'Friday' },
          { category: 'abs', dayName: 'Saturday' }
        ];
        
        for (let day = 0; day < 6; day++) {
          const sessionDate = new Date(startDate);
          // Start from Monday (day 1 of week), skip Sunday (day 0)
          sessionDate.setDate(startDate.getDate() + (week * 7) + day + (startDate.getDay() === 0 ? 1 : (1 - startDate.getDay())));
          
          const { data: sessionData, error: sessionError } = await supabase
            .from('workout_sessions')
            .insert({
              user_id: user!.id,
              date: sessionDate.toISOString().split('T')[0],
              category: dailyPlan[day].category as 'push' | 'pull' | 'legs' | 'abs',
              workout_plan_id: uploadedPlanId,
              duration_minutes: day === 5 ? 45 : 60 // Abs day is shorter
            })
            .select()
            .single();

          if (sessionError) throw sessionError;

          // Add Kishore plan exercises based on category and day
          const exercises = getKishoreExercises(dailyPlan[day].category, day);
          
          for (const exercise of exercises) {
            await supabase
              .from('exercises')
              .insert({
                workout_session_id: sessionData.id,
                exercise_name: exercise.name,
                exercise_type: exercise.type as 'strength' | 'cardio',
                sets: exercise.sets,
                reps: exercise.reps,
                weight_kg: exercise.weight,
                time_minutes: exercise.time_minutes,
                notes: exercise.notes
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

  const getKishoreExercises = (category: string, dayIndex: number) => {
    // Kishore workout plan exercises based on the uploaded images
    switch (category) {
      case 'push':
        if (dayIndex === 0) { // Monday - Push Day 1
          return [
            { name: 'Flat Barbell Bench Press', type: 'strength', sets: 4, reps: 10, weight: null, time_minutes: null, notes: '10-12 reps' },
            { name: 'Incline Dumbbell Press', type: 'strength', sets: 4, reps: 12, weight: null, time_minutes: null, notes: '10-12 reps' },
            { name: 'Decline Barbell Press', type: 'strength', sets: 3, reps: 12, weight: null, time_minutes: null, notes: '10-12 reps' },
            { name: 'Overhead Shoulder Press', type: 'strength', sets: 4, reps: 12, weight: null, time_minutes: null, notes: '10-12 reps' },
            { name: 'Lateral Raises', type: 'strength', sets: 3, reps: 15, weight: null, time_minutes: null, notes: '12-15 reps' },
            { name: 'Tricep Dips', type: 'strength', sets: 3, reps: 12, weight: null, time_minutes: null, notes: '10-12 reps' },
            { name: 'Overhead Tricep Extension', type: 'strength', sets: 3, reps: 12, weight: null, time_minutes: null, notes: '10-12 reps' },
            { name: 'Diamond Push-ups', type: 'strength', sets: 3, reps: 15, weight: null, time_minutes: null, notes: '12-15 reps' }
          ];
        } else { // Thursday - Push Day 2
          return [
            { name: 'Dumbbell Bench Press', type: 'strength', sets: 4, reps: 12, weight: null, time_minutes: null, notes: '10-12 reps' },
            { name: 'Arnold Press', type: 'strength', sets: 4, reps: 12, weight: null, time_minutes: null, notes: '10-12 reps' },
            { name: 'Tricep Pushdowns', type: 'strength', sets: 4, reps: 15, weight: null, time_minutes: null, notes: '12-15 reps' },
            { name: 'Close Grip Push-ups', type: 'strength', sets: 3, reps: 12, weight: null, time_minutes: null, notes: '10-12 reps' }
          ];
        }
      
      case 'pull':
        if (dayIndex === 1) { // Tuesday - Pull Day 1
          return [
            { name: 'Deadlifts', type: 'strength', sets: 4, reps: 8, weight: null, time_minutes: null, notes: '6-8 reps' },
            { name: 'Wide Grip Lat Pulldown', type: 'strength', sets: 4, reps: 12, weight: null, time_minutes: null, notes: '10-12 reps' },
            { name: 'Barbell Rows', type: 'strength', sets: 4, reps: 10, weight: null, time_minutes: null, notes: '8-10 reps' },
            { name: 'Close Grip Lat Pulldown', type: 'strength', sets: 3, reps: 12, weight: null, time_minutes: null, notes: '10-12 reps' },
            { name: 'Face Pulls', type: 'strength', sets: 3, reps: 15, weight: null, time_minutes: null, notes: '12-15 reps' },
            { name: 'Barbell Bicep Curls', type: 'strength', sets: 4, reps: 12, weight: null, time_minutes: null, notes: '10-12 reps' },
            { name: 'Hammer Curls', type: 'strength', sets: 3, reps: 15, weight: null, time_minutes: null, notes: '12-15 reps' },
            { name: 'Preacher Curls', type: 'strength', sets: 3, reps: 12, weight: null, time_minutes: null, notes: '10-12 reps' }
          ];
        } else { // Friday - Pull Day 2
          return [
            { name: 'Incline Dumbbell Row', type: 'strength', sets: 4, reps: 12, weight: null, time_minutes: null, notes: '10-12 reps' },
            { name: 'Close Grip Lat Pulldown', type: 'strength', sets: 4, reps: 12, weight: null, time_minutes: null, notes: '10-12 reps' },
            { name: 'Cable Rows', type: 'strength', sets: 4, reps: 12, weight: null, time_minutes: null, notes: '10-12 reps' },
            { name: 'Reverse Fly', type: 'strength', sets: 3, reps: 15, weight: null, time_minutes: null, notes: '12-15 reps' },
            { name: 'Dumbbell Bicep Curls', type: 'strength', sets: 4, reps: 15, weight: null, time_minutes: null, notes: '12-15 reps' },
            { name: 'Cable Bicep Curls', type: 'strength', sets: 3, reps: 15, weight: null, time_minutes: null, notes: '12-15 reps' },
            { name: 'Concentration Curls', type: 'strength', sets: 3, reps: 12, weight: null, time_minutes: null, notes: '10-12 reps' }
          ];
        }
      
      case 'legs':
        return [
          { name: 'Barbell Squats', type: 'strength', sets: 4, reps: 10, weight: null, time_minutes: null, notes: '8-10 reps' },
          { name: 'Leg Extension', type: 'strength', sets: 4, reps: 15, weight: null, time_minutes: null, notes: '12-15 reps' },
          { name: 'Romanian Deadlifts', type: 'strength', sets: 4, reps: 10, weight: null, time_minutes: null, notes: '8-10 reps' },
          { name: 'Leg Curls', type: 'strength', sets: 4, reps: 15, weight: null, time_minutes: null, notes: '12-15 reps' },
          { name: 'Bulgarian Split Squats', type: 'strength', sets: 3, reps: 12, weight: null, time_minutes: null, notes: '10-12 reps each leg' },
          { name: 'Calf Raises', type: 'strength', sets: 4, reps: 20, weight: null, time_minutes: null, notes: '15-20 reps' },
          { name: 'Walking Lunges', type: 'strength', sets: 3, reps: 15, weight: null, time_minutes: null, notes: '12-15 reps each leg' },
          { name: 'Leg Press', type: 'strength', sets: 4, reps: 15, weight: null, time_minutes: null, notes: '12-15 reps' },
          { name: 'Hip Thrusts', type: 'strength', sets: 4, reps: 12, weight: null, time_minutes: null, notes: '10-12 reps' }
        ];
      
      case 'abs':
        return [
          { name: 'Hip Thrusts', type: 'strength', sets: 4, reps: 12, weight: null, time_minutes: null, notes: '10-12 reps' },
          { name: 'Cable Crunches', type: 'strength', sets: 4, reps: 15, weight: null, time_minutes: null, notes: '12-15 reps' },
          { name: 'Leg Raises', type: 'strength', sets: 4, reps: 15, weight: null, time_minutes: null, notes: '12-15 reps' },
          { name: 'Plank', type: 'strength', sets: 3, reps: null, weight: null, time_minutes: 1, notes: '3x60 sec' },
          { name: 'Russian Twists', type: 'strength', sets: 3, reps: 20, weight: null, time_minutes: null, notes: '15-20 reps each side' },
          { name: 'Treadmill (HIIT)', type: 'cardio', sets: 1, reps: null, weight: null, time_minutes: 30, notes: '2 min walk 1 min run total 30 mins' }
        ];
      
      default:
        return [];
    }
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
                (6 days per week) with the Kishore workout plan: Mon-Push, Tue-Pull, Wed-Legs, Thu-Push, Fri-Pull, Sat-Abs.
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