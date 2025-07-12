import { useState } from 'react';
import { PenTool, Brain, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CreateWorkoutDialogProps {
  onWorkoutCreated: () => void;
}

export const CreateWorkoutDialog = ({ onWorkoutCreated }: CreateWorkoutDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [workoutText, setWorkoutText] = useState('');
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCreateWorkout = async () => {
    if (!user || !workoutText.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide workout details.",
      });
      return;
    }

    setIsProcessing(true);

    try {
      console.log('Sending workout text to AI for processing...');
      
      // First test the Gemini connection
      const { data: testData, error: testError } = await supabase.functions.invoke('test-aiml-connection');
      
      if (testError) {
        console.error('Gemini connection test failed:', testError);
        throw new Error(`Connection test failed: ${testError.message}`);
      }

      if (!testData?.success) {
        console.error('Gemini API test failed:', testData);
        throw new Error(`Gemini API test failed: ${testData?.error || 'Unknown error'}`);
      }

      console.log('Gemini connection test successful:', testData);

      const { data: parseData, error: parseError } = await supabase.functions.invoke('process-workout-text', {
        body: {
          workoutText: workoutText.trim(),
          workoutDate: workoutDate,
          category: category || null,
          userId: user.id
        }
      });

      if (parseError) {
        console.error('AI processing error:', parseError);
        throw parseError;
      }

      if (parseData?.success) {
        toast({
          title: "Workout created successfully!",
          description: `Added ${parseData.exercisesCreated} exercises to your calendar.`,
        });
        
        // Reset form and close dialog
        setOpen(false);
        setWorkoutText('');
        setWorkoutDate(new Date().toISOString().split('T')[0]);
        setCategory('');
        onWorkoutCreated();
        
        // Force page refresh to show new workout
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Workout creation failed:', error);
      toast({
        variant: "destructive",
        title: "Failed to create workout",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const exampleText = `Today I did:
- 3 sets of 12 push-ups
- 4 sets of 10 squats with 20kg
- 30 minutes cardio on treadmill
- 3 sets of 15 bicep curls with 15kg dumbbells
- Plank hold for 2 minutes

Notes: Felt strong today, increased weight on squats`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
          <PenTool className="h-6 w-6" />
          <span>Create Workout</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <span>Create Workout with AI</span>
          </DialogTitle>
          <DialogDescription>
            Describe your workout in natural language and AI will structure it for your calendar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workoutDate">Workout Date</Label>
              <Input
                id="workoutDate"
                type="date"
                value={workoutDate}
                onChange={(e) => setWorkoutDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category">Category (Optional)</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Let AI decide" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Let AI decide</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                  <SelectItem value="pull">Pull</SelectItem>
                  <SelectItem value="legs">Legs</SelectItem>
                  <SelectItem value="abs">Abs</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="treadmill">Treadmill</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="workoutText">Workout Description</Label>
            <Textarea
              id="workoutText"
              placeholder={exampleText}
              value={workoutText}
              onChange={(e) => setWorkoutText(e.target.value)}
              className="min-h-[200px] resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Describe your exercises, sets, reps, weights, duration, etc. Be as detailed as you want!
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI Processing</span>
            </div>
            <p className="text-xs text-muted-foreground">
              The AI will automatically extract exercises, sets, reps, weights, and timing from your description.
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkout}
              disabled={!workoutText.trim() || isProcessing}
            >
              {isProcessing ? "Processing..." : "Create Workout"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};