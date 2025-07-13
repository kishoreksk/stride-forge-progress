import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, 
  Dumbbell, 
  BarChart3, 
  TrendingUp, 
  Clock,
  MapPin,
  User,
  MessageCircle,
  Send
} from 'lucide-react';
import { format } from 'date-fns';

interface SharedReportData {
  report: any;
  workouts: any[];
  progressPhotos: any[];
  comments: any[];
  stats: {
    totalWorkouts: number;
    totalExercises: number;
    totalSets: number;
    categoriesWorked: string[];
  };
  weekRange: {
    start: string;
    end: string;
  };
}

const SharedReportPage = () => {
  const { token } = useParams<{ token: string }>();
  const [reportData, setReportData] = useState<SharedReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commenterName, setCommenterName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      fetchReportData();
    }
  }, [token]);

  const fetchReportData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(`shared-report?token=${token}`, {
        method: 'GET'
      });

      if (error) throw error;

      if (data.success) {
        setReportData(data);
      } else {
        throw new Error(data.error || 'Report not found');
      }
    } catch (error: any) {
      console.error('Error fetching shared report:', error);
      toast({
        variant: "destructive",
        title: "Error loading report",
        description: error.message || "Failed to load shared report",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitComment = async () => {
    if (!commenterName.trim() || !commentText.trim() || !token) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: "Please enter both your name and comment",
      });
      return;
    }

    setIsSubmittingComment(true);

    try {
      const { data, error } = await supabase.functions.invoke('shared-report?action=comment', {
        body: {
          shareToken: token,
          commenterName: commenterName.trim(),
          commentText: commentText.trim()
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Comment added!",
          description: "Your comment has been posted successfully.",
        });
        
        setCommenterName('');
        setCommentText('');
        // Don't refresh to show comments - comments are private
      } else {
        throw new Error('Failed to add comment');
      }
    } catch (error: any) {
      console.error('Error submitting comment:', error);
      toast({
        variant: "destructive",
        title: "Comment failed",
        description: error.message || "Failed to add comment",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'push': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'pull': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'legs': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'abs': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'cardio': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'treadmill': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Report Not Found</h2>
            <p className="text-muted-foreground">This shared report may have been removed or the link is invalid.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { report, workouts, progressPhotos, comments, stats, weekRange } = reportData;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2 text-foreground">{report.title}</h1>
            <p className="text-muted-foreground mb-4">
              {format(new Date(weekRange.start), 'MMMM d')} - {format(new Date(weekRange.end), 'MMMM d, yyyy')}
            </p>
            
            {/* Gym and Coach Info */}
            <div className="flex justify-center items-center gap-8 text-sm bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Fusion Fitness</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Coach: SunielKumar</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Workouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWorkouts}</div>
              <Calendar className="h-4 w-4 mt-2 text-muted-foreground" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Exercises</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalExercises}</div>
              <Dumbbell className="h-4 w-4 mt-2 text-muted-foreground" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSets}</div>
              <BarChart3 className="h-4 w-4 mt-2 text-muted-foreground" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.categoriesWorked.length}</div>
              <div className="text-xs text-muted-foreground mt-1">{stats.categoriesWorked.join(', ')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Photos */}
        {progressPhotos.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progress Photos
              </CardTitle>
              <CardDescription>Visual progress for this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {progressPhotos.map((photo: any, index: number) => (
                  <div key={photo.id} className="space-y-3">
                    <div className="aspect-[4/3] overflow-hidden rounded-lg border">
                      <img
                        src={photo.photo_url}
                        alt={`Progress photo ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                        onClick={() => window.open(photo.photo_url, '_blank')}
                      />
                    </div>
                    {photo.notes && (
                      <p className="text-sm text-muted-foreground">{photo.notes}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(photo.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Workout Details */}
        {workouts.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Workout Details</CardTitle>
              <CardDescription>Complete breakdown of all exercises and sets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {workouts.map((workout: any) => (
                  <div key={workout.id} className="border rounded-lg p-4 bg-card">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <Badge className={getCategoryColor(workout.category)}>
                          {workout.category.toUpperCase()}
                        </Badge>
                        <span className="font-medium">
                          {format(new Date(workout.date), 'EEEE, MMM d')}
                        </span>
                      </div>
                      {workout.duration_minutes && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {workout.duration_minutes} min
                        </span>
                      )}
                    </div>
                    
                    {workout.notes && (
                      <div className="mb-4 p-3 bg-muted rounded border-l-4 border-primary">
                        <p className="text-sm italic">"{workout.notes}"</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      {workout.exercises?.map((exercise: any) => (
                        <div key={exercise.id} className="bg-background rounded p-3 border">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{exercise.exercise_name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {exercise.exercise_type}
                                </Badge>
                                {exercise.is_progressive && (
                                  <Badge className="bg-green-100 text-green-800 text-xs">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    +{exercise.weight_improvement_kg}kg
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Display individual sets */}
                          {exercise.exercise_sets && exercise.exercise_sets.length > 0 ? (
                            <div className="mt-2">
                              <div className="text-xs text-muted-foreground mb-2">Sets:</div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {exercise.exercise_sets
                                  .sort((a: any, b: any) => a.set_number - b.set_number)
                                  .map((set: any) => (
                                    <div 
                                      key={set.id} 
                                      className="bg-muted rounded px-2 py-1 text-xs text-center"
                                    >
                                      <div className="font-medium">Set {set.set_number}</div>
                                      <div className="text-muted-foreground">
                                        {set.reps} reps
                                        {set.weight_kg && ` × ${set.weight_kg}kg`}
                                      </div>
                                    </div>
                                  ))
                                }
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground mt-1">
                              {[
                                exercise.sets && `${exercise.sets} sets`,
                                exercise.reps && `${exercise.reps} reps`,
                                exercise.weight_kg && `${exercise.weight_kg}kg`,
                                exercise.distance_km && `${exercise.distance_km}km`,
                                exercise.time_minutes && `${exercise.time_minutes} min`,
                                exercise.laps && `${exercise.laps} laps`
                              ].filter(Boolean).join(' • ')}
                            </div>
                          )}
                          
                          {exercise.notes && (
                            <p className="text-sm text-muted-foreground mt-2 italic">
                              Notes: {exercise.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comments Section - For adding comments only */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Leave Feedback
            </CardTitle>
            <CardDescription>
              Share your thoughts, encouragement, or feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Add Comment Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    value={commenterName}
                    onChange={(e) => setCommenterName(e.target.value)}
                    placeholder="Enter your name"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="comment">Your Comment</Label>
                <Textarea
                  id="comment"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts, encouragement, or feedback..."
                  className="mt-1 min-h-[100px]"
                />
              </div>
              
              <Button 
                onClick={submitComment}
                disabled={isSubmittingComment || !commenterName.trim() || !commentText.trim()}
                className="w-full md:w-auto"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmittingComment ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SharedReportPage;
