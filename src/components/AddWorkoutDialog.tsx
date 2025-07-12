import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { SetDetailsDialog } from './SetDetailsDialog';

const workoutSchema = z.object({
  date: z.date(),
  category: z.enum(['push', 'pull', 'legs', 'abs', 'cardio', 'treadmill']),
  duration_minutes: z.number().min(1).optional(),
  notes: z.string().optional(),
});

const exerciseSchema = z.object({
  exercise_name: z.string().min(1, 'Exercise name is required'),
  exercise_type: z.enum(['strength', 'cardio']),
  sets: z.number().min(1).optional(),
  reps: z.number().min(1).optional(),
  weight_kg: z.number().min(0).optional(),
  distance_km: z.number().min(0).optional(),
  time_minutes: z.number().min(1).optional(),
  laps: z.number().min(1).optional(),
  notes: z.string().optional(),
});

interface ExerciseSet {
  set_number: number;
  reps: number;
  weight_kg?: number;
}

interface Exercise {
  exercise_name: string;
  exercise_type: 'strength' | 'cardio';
  sets?: number;
  reps?: number;
  weight_kg?: number;
  distance_km?: number;
  time_minutes?: number;
  laps?: number;
  notes?: string;
  exercise_sets?: ExerciseSet[];
}

interface AddWorkoutDialogProps {
  onWorkoutAdded: () => void;
  children?: React.ReactNode;
}

export const AddWorkoutDialog = ({ onWorkoutAdded, children }: AddWorkoutDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof workoutSchema>>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      date: new Date(),
      category: 'push',
    },
  });

  const addExercise = () => {
    setExercises([...exercises, {
      exercise_name: '',
      exercise_type: 'strength',
    }]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const onSubmit = async (data: z.infer<typeof workoutSchema>) => {
    if (!user) return;
    
    if (exercises.length === 0) {
      toast({
        variant: "destructive",
        title: "No exercises added",
        description: "Please add at least one exercise to your workout.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create workout session
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          date: format(data.date, 'yyyy-MM-dd'),
          category: data.category,
          duration_minutes: data.duration_minutes,
          notes: data.notes,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Add exercises and their sets
      for (const exercise of exercises) {
        const { exercise_sets, ...exerciseData } = exercise;
        
        const { data: exerciseRecord, error: exerciseError } = await supabase
          .from('exercises')
          .insert({
            workout_session_id: session.id,
            ...exerciseData,
          })
          .select()
          .single();

        if (exerciseError) throw exerciseError;

        // Add sets if they exist
        if (exercise_sets && exercise_sets.length > 0) {
          const setsData = exercise_sets.map(set => ({
            exercise_id: exerciseRecord.id,
            set_number: set.set_number,
            reps: set.reps,
            weight_kg: exercise.exercise_type === 'strength' ? set.weight_kg : null
          }));

          const { error: setsError } = await supabase
            .from('exercise_sets')
            .insert(setsData);

          if (setsError) throw setsError;
        }
      }

      toast({
        title: "Workout added successfully!",
        description: `${exercises.length} exercises logged for ${data.category} workout.`,
      });

      setOpen(false);
      form.reset();
      setExercises([]);
      onWorkoutAdded();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding workout",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="h-20 flex flex-col items-center justify-center space-y-2">
            <Plus className="h-6 w-6" />
            <span>Add Workout</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Workout</DialogTitle>
          <DialogDescription>
            Log your workout session and exercises
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="push">Push</SelectItem>
                        <SelectItem value="pull">Pull</SelectItem>
                        <SelectItem value="legs">Legs</SelectItem>
                        <SelectItem value="abs">Abs</SelectItem>
                        <SelectItem value="cardio">Cardio</SelectItem>
                        <SelectItem value="treadmill">Treadmill</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any notes about your workout..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Exercises Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Exercises</h3>
                <Button type="button" onClick={addExercise} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exercise
                </Button>
              </div>

              {exercises.map((exercise, index) => (
                <Card key={index}>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Exercise {index + 1}</CardTitle>
                      <Button
                        type="button"
                        onClick={() => removeExercise(index)}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Exercise Name</Label>
                        <Input
                          placeholder="e.g., Bench Press"
                          value={exercise.exercise_name}
                          onChange={(e) => updateExercise(index, 'exercise_name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={exercise.exercise_type}
                          onValueChange={(value: 'strength' | 'cardio') => 
                            updateExercise(index, 'exercise_type', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="strength">Strength</SelectItem>
                            <SelectItem value="cardio">Cardio</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {exercise.exercise_type === 'strength' ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Sets</Label>
                          <Input
                            type="number"
                            placeholder="3"
                            value={exercise.sets || ''}
                            onChange={(e) => updateExercise(index, 'sets', e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </div>
                        <div>
                          <Label>Reps</Label>
                          <Input
                            type="number"
                            placeholder="10"
                            value={exercise.reps || ''}
                            onChange={(e) => updateExercise(index, 'reps', e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </div>
                        <div>
                          <Label>Weight (kg)</Label>
                          <Input
                            type="number"
                            step="0.5"
                            placeholder="20"
                            value={exercise.weight_kg || ''}
                            onChange={(e) => updateExercise(index, 'weight_kg', e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Distance (km)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="5.0"
                            value={exercise.distance_km || ''}
                            onChange={(e) => updateExercise(index, 'distance_km', e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </div>
                        <div>
                          <Label>Time (minutes)</Label>
                          <Input
                            type="number"
                            placeholder="30"
                            value={exercise.time_minutes || ''}
                            onChange={(e) => updateExercise(index, 'time_minutes', e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </div>
                        <div>
                          <Label>Laps</Label>
                          <Input
                            type="number"
                            placeholder="10"
                            value={exercise.laps || ''}
                            onChange={(e) => updateExercise(index, 'laps', e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        placeholder="Exercise notes..."
                        value={exercise.notes || ''}
                        onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                        className="resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {exercises.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                  <p className="text-muted-foreground mb-4">No exercises added yet</p>
                  <Button type="button" onClick={addExercise} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Exercise
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Workout"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};