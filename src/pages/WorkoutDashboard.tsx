import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Dumbbell,
  Clock,
  BarChart3,
  ArrowLeft,
  TrendingUp,
  Target,
  Settings
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { MarkAbsentDialog } from '@/components/MarkAbsentDialog';
import { SetDetailsDialog } from '@/components/SetDetailsDialog';
import { ProgressPhotoManager } from '@/components/ProgressPhotoManager';
import { WeeklyPDFGenerator } from '@/components/WeeklyPDFGenerator';
import { ShareWeeklyReport } from '@/components/ShareWeeklyReport';
import { ViewReportComments } from '@/components/ViewReportComments';
import { CopyWorkoutSchedule } from '@/components/CopyWorkoutSchedule';
import { DeleteExerciseDialog } from '@/components/DeleteExerciseDialog';
import { AddWorkoutDialog } from '@/components/AddWorkoutDialog';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';

interface ExerciseSet {
  id: string;
  set_number: number;
  reps: number;
  weight_kg: number | null;
}

interface WorkoutSession {
  id: string;
  date: string;
  category: string;
  duration_minutes: number | null;
  notes: string | null;
  exercises: {
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
  }[];
}

const WorkoutDashboard = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWeeklyWorkouts();
    }
  }, [user, currentWeek]);

  // Redirect if not authenticated (after all hooks are called)
  if (!user && !loading) {
    return <Navigate to="/auth" replace />;
  }

  const fetchWeeklyWorkouts = async () => {
    setIsLoading(true);
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start
    const weekEnd = addDays(weekStart, 6);

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
      .eq('user_id', user?.id)
      .gte('date', format(weekStart, 'yyyy-MM-dd'))
      .lte('date', format(weekEnd, 'yyyy-MM-dd'))
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching weekly workouts:', error);
      toast({
        variant: "destructive",
        title: "Error loading workouts",
        description: error.message,
      });
    } else {
      setWeeklyWorkouts(data || []);
    }
    setIsLoading(false);
  };

  const getWorkoutForDay = (day: Date) => {
    return weeklyWorkouts.filter(workout => 
      isSameDay(parseISO(workout.date), day)
    );
  };

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

  const getDayName = (day: Date) => format(day, 'EEEE');
  const getDayNumber = (day: Date) => format(day, 'd');
  const getWeekRange = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => 
    addDays(startOfWeek(currentWeek, { weekStartsOn: 1 }), i)
  );

  const totalWeeklyExercises = weeklyWorkouts.reduce((total, workout) => 
    total + workout.exercises.length, 0
  );

  const totalWeeklySets = weeklyWorkouts.reduce((total, workout) => 
    total + workout.exercises.reduce((exerciseTotal, exercise) => 
      exerciseTotal + (exercise.sets || 0), 0
    ), 0
  );

  const totalWeeklyDuration = weeklyWorkouts.reduce((total, workout) => 
    total + (workout.duration_minutes || 0), 0
  );

  const progressiveExercises = weeklyWorkouts.reduce((total, workout) => 
    total + workout.exercises.filter(exercise => exercise.is_progressive).length, 0
  );

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-primary mr-3" />
                <h1 className="text-xl font-semibold">Workout Calendar</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="outline" 
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous Week
          </Button>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">{getWeekRange()}</h2>
            <p className="text-muted-foreground">Weekly Workout Schedule</p>
            <div className="flex justify-center gap-2 flex-wrap">
              <AddWorkoutDialog onWorkoutAdded={fetchWeeklyWorkouts}>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Add Workout
                </Button>
              </AddWorkoutDialog>
              <CopyWorkoutSchedule 
                weekStartDate={startOfWeek(currentWeek, { weekStartsOn: 1 })} 
                onScheduleCopied={fetchWeeklyWorkouts}
              />
              <ProgressPhotoManager 
                weekStartDate={startOfWeek(currentWeek, { weekStartsOn: 1 })} 
                onPhotoUpdate={fetchWeeklyWorkouts}
              />
              <WeeklyPDFGenerator 
                weekStartDate={startOfWeek(currentWeek, { weekStartsOn: 1 })} 
              />
              <ShareWeeklyReport 
                weekStartDate={startOfWeek(currentWeek, { weekStartsOn: 1 })} 
              />
              <ViewReportComments 
                weekStartDate={startOfWeek(currentWeek, { weekStartsOn: 1 })} 
              />
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          >
            Next Week
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Weekly Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exercises</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWeeklyExercises}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sets</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWeeklySets}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWeeklyDuration} min</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progressive</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{progressiveExercises}</div>
              <p className="text-xs text-muted-foreground">Weight increases</p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Calendar with Accordions */}
        <div className="space-y-4">
          <Accordion type="multiple" className="w-full">
            {weekDays.map((day) => {
              const dayWorkouts = getWorkoutForDay(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <AccordionItem key={day.toString()} value={day.toString()}>
                  <AccordionTrigger className={`px-6 py-4 ${isToday ? 'bg-primary/5 border-primary/20' : ''}`}>
                    <div className="flex items-center justify-between w-full mr-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-sm font-medium text-muted-foreground">
                            {getDayName(day)}
                          </p>
                          <p className={`text-2xl font-bold ${isToday ? 'text-primary' : ''}`}>
                            {getDayNumber(day)}
                          </p>
                        </div>
                        {dayWorkouts.length > 0 && (
                          <div className="flex gap-2">
                            {dayWorkouts.map((workout) => (
                              <Badge key={workout.id} className={getCategoryColor(workout.category)}>
                                {workout.category.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {dayWorkouts.length === 0 && (
                        <span className="text-sm text-muted-foreground">Rest Day</span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    {dayWorkouts.length === 0 ? (
                      <div className="text-center py-4 space-y-2">
                        <p className="text-sm text-muted-foreground">Rest Day</p>
                        <MarkAbsentDialog 
                          date={day} 
                          dayName={getDayName(day)} 
                          onAbsentMarked={fetchWeeklyWorkouts}
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {dayWorkouts.map((workout) => (
                          <div key={workout.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge className={getCategoryColor(workout.category)}>
                                {workout.category.toUpperCase()}
                              </Badge>
                              {workout.duration_minutes && (
                                <span className="text-xs text-muted-foreground flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {workout.duration_minutes}m
                                </span>
                              )}
                            </div>
                            
                            <div className="space-y-1">
                              {workout.exercises.map((exercise, index) => (
                                <div 
                                  key={exercise.id} 
                                  className="text-xs p-2 bg-muted rounded border space-y-2"
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <div className="font-medium text-foreground">
                                          {exercise.exercise_name}
                                        </div>
                                        {exercise.is_progressive && exercise.exercise_type === 'strength' && (
                                          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs px-1 py-0">
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            +{exercise.weight_improvement_kg}kg
                                          </Badge>
                                        )}
                                      </div>
                                       {/* Display individual sets */}
                                       {exercise.exercise_sets && exercise.exercise_sets.length > 0 ? (
                                         <div className="space-y-1 mt-2">
                                           <div className="text-muted-foreground text-xs">Sets:</div>
                                           <div className="grid grid-cols-2 gap-1">
                                             {exercise.exercise_sets
                                               .sort((a, b) => a.set_number - b.set_number)
                                               .map((set) => (
                                                 <div 
                                                   key={set.id} 
                                                   className="flex items-center justify-between bg-background/50 rounded px-2 py-1 text-xs"
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
                                             <div className="text-orange-600 text-xs">
                                               Previous: {exercise.previous_weight_kg}kg
                                             </div>
                                           )}
                                         </div>
                                       ) : (
                                         <div className="text-muted-foreground flex items-center space-x-2 mt-1">
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
                                     </div>
                                      <div className="flex space-x-1">
                                        <SetDetailsDialog
                                          exerciseId={exercise.id}
                                          exerciseName={exercise.exercise_name}
                                          exerciseType={exercise.exercise_type}
                                          onSetsUpdated={fetchWeeklyWorkouts}
                                        >
                                          <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                                            <Settings className="h-3 w-3" />
                                          </Button>
                                        </SetDetailsDialog>
                                        <DeleteExerciseDialog
                                          exerciseId={exercise.id}
                                          exerciseName={exercise.exercise_name}
                                          onExerciseDeleted={fetchWeeklyWorkouts}
                                        />
                                      </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {workout.notes && (
                              <div className="text-xs text-muted-foreground italic p-2 bg-muted/50 rounded">
                                "{workout.notes}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default WorkoutDashboard;
