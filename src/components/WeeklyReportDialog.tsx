import { useState } from 'react';
import { BarChart3, Download, Calendar, TrendingUp } from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface WeeklyReportDialogProps {
  onReportGenerated: () => void;
}

interface WeeklyData {
  workouts: any[];
  progressPhotos: any[];
  totalWorkouts: number;
  totalSets: number;
  totalExercises: number;
  categoriesWorked: string[];
}

export const WeeklyReportDialog = ({ onReportGenerated }: WeeklyReportDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchWeeklyData = async (weekDate: Date) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const weekStart = startOfWeek(weekDate);
      const weekEnd = endOfWeek(weekDate);

      // Fetch workouts for the week with detailed exercise sets
      const { data: workouts, error: workoutsError } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          exercises (
            *,
            exercise_sets (
              set_number,
              reps,
              weight_kg
            )
          )
        `)
        .eq('user_id', user.id)
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (workoutsError) throw workoutsError;

      // Fetch progress photos for the week (can be multiple)
      const { data: progressPhotos, error: photoError } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start_date', format(weekStart, 'yyyy-MM-dd'))
        .order('created_at', { ascending: true });

      // Calculate statistics
      const totalWorkouts = workouts?.length || 0;
      const totalExercises = workouts?.reduce((sum, workout) => sum + (workout.exercises?.length || 0), 0) || 0;
      const totalSets = workouts?.reduce((sum, workout) => 
        sum + (workout.exercises?.reduce((setSum: number, exercise: any) => setSum + (exercise.sets || 0), 0) || 0), 0) || 0;
      
      const categoriesWorked = [...new Set(workouts?.map(w => w.category) || [])];

      setWeeklyData({
        workouts: workouts || [],
        progressPhotos: photoError ? [] : (progressPhotos || []),
        totalWorkouts,
        totalSets,
        totalExercises,
        categoriesWorked,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching data",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDFReport = async () => {
    if (!weeklyData) return;

    setIsGenerating(true);
    try {
      const weekStart = startOfWeek(selectedWeek);
      const weekEnd = endOfWeek(selectedWeek);

      // Create HTML content for the report
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Weekly Fitness Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat-card { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .workout { margin: 15px 0; padding: 15px; border: 1px solid #eee; border-radius: 8px; }
            .exercise { margin: 8px 0; padding: 8px; background: #f9f9f9; border-radius: 4px; }
            .progress-photo { text-align: center; margin: 20px 0; page-break-inside: avoid; }
            .progress-photo img { max-width: 400px; height: auto; border: 1px solid #ddd; border-radius: 8px; }
            @media print { .progress-photo { page-break-before: always; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Weekly Fitness Report</h1>
            <p>${format(weekStart, 'PPP')} - ${format(weekEnd, 'PPP')}</p>
          </div>
          
          <div class="stats">
            <div class="stat-card">
              <h3>${weeklyData.totalWorkouts}</h3>
              <p>Total Workouts</p>
            </div>
            <div class="stat-card">
              <h3>${weeklyData.totalExercises}</h3>
              <p>Total Exercises</p>
            </div>
            <div class="stat-card">
              <h3>${weeklyData.totalSets}</h3>
              <p>Total Sets</p>
            </div>
          </div>

          <h2>Workout Details</h2>
          ${weeklyData.workouts.map(workout => `
            <div class="workout">
              <h3>${format(new Date(workout.date), 'EEEE, PPP')} - ${workout.category.toUpperCase()}</h3>
              ${workout.duration_minutes ? `<p>Duration: ${workout.duration_minutes} minutes</p>` : ''}
              ${workout.notes ? `<p>Notes: ${workout.notes}</p>` : ''}
              <h4>Exercises:</h4>
              ${workout.exercises.map((exercise: any) => `
                <div class="exercise">
                  <strong>${exercise.exercise_name}</strong> (${exercise.exercise_type})
                  ${exercise.distance_km ? `<br>Distance: ${exercise.distance_km}km` : ''}
                  ${exercise.time_minutes ? `<br>Time: ${exercise.time_minutes} min` : ''}
                  ${exercise.laps ? `<br>Laps: ${exercise.laps}` : ''}
                  ${exercise.exercise_sets && exercise.exercise_sets.length > 0 ? `
                    <br><strong>Sets:</strong>
                    <div style="margin-left: 20px;">
                      ${exercise.exercise_sets.map((set: any) => `
                        <div>Set ${set.set_number}: ${set.reps} reps${set.weight_kg ? ` @ ${set.weight_kg}kg` : ''}</div>
                      `).join('')}
                    </div>
                  ` : exercise.sets ? `<br>Sets: ${exercise.sets}${exercise.reps ? `, Reps: ${exercise.reps}` : ''}${exercise.weight_kg ? `, Weight: ${exercise.weight_kg}kg` : ''}` : ''}
                  ${exercise.notes ? `<br><em>Notes: ${exercise.notes}</em>` : ''}
                </div>
              `).join('')}
            </div>
          `).join('')}

          ${weeklyData.progressPhotos && weeklyData.progressPhotos.length > 0 ? `
            <div class="progress-photo">
              <h2>Progress Photos</h2>
              ${weeklyData.progressPhotos.map((photo: any, index: number) => `
                <div style="margin-bottom: 20px;">
                  <h3>Photo ${index + 1}</h3>
                  <img src="${photo.photo_url}" alt="Progress Photo ${index + 1}" />
                  ${photo.notes ? `<p><em>${photo.notes}</em></p>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </body>
        </html>
      `;

      // Create a blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitness-report-${format(weekStart, 'yyyy-MM-dd')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Report generated!",
        description: "Your weekly fitness report has been downloaded.",
      });

      onReportGenerated();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error generating report",
        description: error.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      fetchWeeklyData(selectedWeek);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'push': return 'bg-red-100 text-red-800';
      case 'pull': return 'bg-blue-100 text-blue-800';
      case 'legs': return 'bg-green-100 text-green-800';
      case 'abs': return 'bg-yellow-100 text-yellow-800';
      case 'cardio': return 'bg-purple-100 text-purple-800';
      case 'treadmill': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
          <BarChart3 className="h-6 w-6" />
          <span>Weekly Report</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Weekly Fitness Report</DialogTitle>
          <DialogDescription>
            Generate and download your weekly fitness summary
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Week Selection */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span className="font-medium">
                Week of {format(startOfWeek(selectedWeek), 'PPP')}
              </span>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedWeek(subWeeks(selectedWeek, 1))}
              >
                Previous Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedWeek(new Date())}
                disabled={format(selectedWeek, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}
              >
                This Week
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : weeklyData ? (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Workouts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{weeklyData.totalWorkouts}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Exercises</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{weeklyData.totalExercises}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Sets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{weeklyData.totalSets}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {weeklyData.categoriesWorked.map(category => (
                        <Badge key={category} className={getCategoryColor(category)}>
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Workout Summary */}
              {weeklyData.workouts.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Workout Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {weeklyData.workouts.map((workout, index) => (
                      <div key={workout.id} className="p-4 border border-border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={getCategoryColor(workout.category)}>
                              {workout.category.toUpperCase()}
                            </Badge>
                            <span className="font-medium">
                              {format(new Date(workout.date), 'EEEE, MMM d')}
                            </span>
                          </div>
                          {workout.duration_minutes && (
                            <span className="text-sm text-muted-foreground">
                              {workout.duration_minutes} min
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {workout.exercises?.length || 0} exercises, 
                          {workout.exercises?.reduce((sum: number, ex: any) => sum + (ex.sets || 0), 0) || 0} sets
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No workouts found for this week</p>
                  </CardContent>
                </Card>
              )}

              {/* Progress Photos */}
              {weeklyData.progressPhotos && weeklyData.progressPhotos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Progress Photos</CardTitle>
                    <CardDescription>
                      {weeklyData.progressPhotos.length} photo(s) for this week
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {weeklyData.progressPhotos.map((photo: any, index: number) => (
                        <div key={photo.id} className="text-center">
                          <img
                            src={photo.photo_url}
                            alt={`Progress photo ${index + 1}`}
                            className="w-full max-w-xs mx-auto rounded-lg border"
                            onError={(e) => {
                              console.error('Image failed to load:', photo.photo_url);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          {photo.notes && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              {photo.notes}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Uploaded: {format(new Date(photo.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Generate Report Button */}
              <div className="flex justify-end">
                <Button
                  onClick={generatePDFReport}
                  disabled={isGenerating || weeklyData.totalWorkouts === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isGenerating ? "Generating..." : "Download Report"}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};