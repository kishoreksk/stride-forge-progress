import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dumbbell, Clock, TrendingUp, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { SetDetailsDialog } from '@/components/SetDetailsDialog';
import { DeleteExerciseDialog } from '@/components/DeleteExerciseDialog';

interface ExerciseSet {
  id: string;
  set_number: number;
  reps: number;
  weight_kg: number | null;
}

interface Exercise {
  id: string;
  exercise_name: string;
  exercise_type: string;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  notes: string | null;
  is_progressive: boolean | null;
  previous_weight_kg: number | null;
  weight_improvement_kg: number | null;
  exercise_sets?: ExerciseSet[];
}

interface TodaysWorkoutData {
  id: string;
  date: string;
  category: string;
  duration_minutes: number | null;
  notes: string | null;
  exercises: Exercise[];
}

export const DashboardTodaysWorkout = () => {
  const { user } = useAuth();
  const [todaysWorkout, setTodaysWorkout] = useState<TodaysWorkoutData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTodaysWorkout = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const today = format(new Date(), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('workout_sessions')
      .select(`
        id,
        date,
        category,
        duration_minutes,
        notes,
        exercises (
          id,
          exercise_name,
          exercise_type,
          sets,
          reps,
          weight_kg,
          notes,
          is_progressive,
          previous_weight_kg,
          weight_improvement_kg,
          exercise_sets (
            id,
            set_number,
            reps,
            weight_kg
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (error) {
      console.error('Error fetching today\'s workout:', error);
    } else {
      setTodaysWorkout(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTodaysWorkout();
  }, [user]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'push': return 'bg-red-100 text-red-800 border-red-200';
      case 'pull': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'legs': return 'bg-green-100 text-green-800 border-green-200';
      case 'abs': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cardio': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'treadmill': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Dumbbell className="h-5 w-5 mr-2" />
            Today's Workout - {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!todaysWorkout) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Dumbbell className="h-5 w-5 mr-2" />
            Today's Workout - {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No workout scheduled for today.</p>
            <p className="text-sm text-muted-foreground mt-2">Enjoy your rest day!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Dumbbell className="h-5 w-5 mr-2" />
            Today's Workout - {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </CardTitle>
          <div className="flex items-center space-x-4">
            <Badge className={getCategoryColor(todaysWorkout.category)}>
              {todaysWorkout.category.toUpperCase()}
            </Badge>
            {todaysWorkout.duration_minutes && (
              <span className="text-sm text-muted-foreground flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {todaysWorkout.duration_minutes} minutes
              </span>
            )}
          </div>
        </div>
        {todaysWorkout.notes && (
          <CardDescription className="italic">
            "{todaysWorkout.notes}"
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Exercises ({todaysWorkout.exercises.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todaysWorkout.exercises.map((exercise) => (
              <Card key={exercise.id} className="border-l-4 border-l-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{exercise.exercise_name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      {exercise.is_progressive && exercise.exercise_type === 'strength' && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{exercise.weight_improvement_kg}kg
                        </Badge>
                      )}
                      <div className="flex space-x-1">
                        <SetDetailsDialog
                          exerciseId={exercise.id}
                          exerciseName={exercise.exercise_name}
                          exerciseType={exercise.exercise_type}
                          onSetsUpdated={fetchTodaysWorkout}
                        >
                          <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                            <Settings className="h-3 w-3" />
                          </Button>
                        </SetDetailsDialog>
                        <DeleteExerciseDialog
                          exerciseId={exercise.id}
                          exerciseName={exercise.exercise_name}
                          onExerciseDeleted={fetchTodaysWorkout}
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {exercise.exercise_sets && exercise.exercise_sets.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Sets:</div>
                      <div className="grid grid-cols-2 gap-2">
                        {exercise.exercise_sets
                          .sort((a, b) => a.set_number - b.set_number)
                          .map((set) => (
                            <div 
                              key={set.id} 
                              className="flex items-center justify-between bg-muted rounded px-3 py-2 text-sm"
                            >
                              <span className="text-muted-foreground">Set {set.set_number}:</span>
                              <span className="font-medium">
                                {set.reps} reps
                                {set.weight_kg && ` × ${set.weight_kg}kg`}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                      {exercise.previous_weight_kg && !exercise.is_progressive && (
                        <div className="text-orange-600 text-sm">
                          Previous weight: {exercise.previous_weight_kg}kg
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground flex items-center space-x-3">
                      {exercise.sets && (
                        <span>{exercise.sets} sets</span>
                      )}
                      {exercise.reps && (
                        <span>• {exercise.reps} reps</span>
                      )}
                      {exercise.weight_kg && (
                        <span>• {exercise.weight_kg}kg</span>
                      )}
                      {exercise.previous_weight_kg && !exercise.is_progressive && (
                        <span className="text-orange-600">
                          • (prev: {exercise.previous_weight_kg}kg)
                        </span>
                      )}
                    </div>
                  )}
                  
                  {exercise.notes && (
                    <div className="text-sm text-muted-foreground italic mt-2 p-2 bg-muted/50 rounded">
                      "{exercise.notes}"
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};