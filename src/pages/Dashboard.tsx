import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AddWorkoutDialog } from '@/components/AddWorkoutDialog';
import { UploadPlanDialog } from '@/components/UploadPlanDialog';
import { CreateWorkoutDialog } from '@/components/CreateWorkoutDialog';
import { ProgressPhotoDialog } from '@/components/ProgressPhotoDialog';
import { WeeklyReportDialog } from '@/components/WeeklyReportDialog';
import { UploadSpecificPhotos } from '@/components/UploadSpecificPhotos';
import { DeleteAllPhotos } from '@/components/DeleteAllPhotos';
import { 
  Dumbbell, 
  LogOut, 
  Calendar, 
  TrendingUp, 
  BarChart3,
  Upload,
  Trash2
} from 'lucide-react';

interface WorkoutSession {
  id: string;
  date: string;
  category: string;
  duration_minutes: number | null;
  exercises: {
    exercise_name: string;
    exercise_type: string;
    sets: number | null;
    reps: number | null;
    weight_kg: number | null;
  }[];
}

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const { toast } = useToast();
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [workoutPlans, setWorkoutPlans] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    thisWeekWorkouts: 0,
    totalSets: 0,
  });

  // Redirect if not authenticated
  if (!user && !loading) {
    return <Navigate to="/auth" replace />;
  }

  const fetchData = () => {
    fetchProfile();
    fetchRecentWorkouts();
    fetchWorkoutPlans();
    fetchStats();
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
    } else if (data) {
      setProfile(data);
    }
  };

  const fetchRecentWorkouts = async () => {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select(`
        id,
        date,
        category,
        duration_minutes,
        exercises (
          exercise_name,
          exercise_type,
          sets,
          reps,
          weight_kg
        )
      `)
      .eq('user_id', user?.id)
      .order('date', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching workouts:', error);
    } else {
      setRecentWorkouts(data || []);
    }
  };

  const fetchWorkoutPlans = async () => {
    const { data, error } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching workout plans:', error);
    } else {
      setWorkoutPlans(data || []);
    }
  };

  const fetchStats = async () => {
    // Get total workouts
    const { count: totalWorkouts } = await supabase
      .from('workout_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id);

    // Get this week's workouts
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const { count: thisWeekWorkouts } = await supabase
      .from('workout_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id)
      .gte('date', startOfWeek.toISOString().split('T')[0]);

    // Get total sets
    const { data: exerciseData } = await supabase
      .from('exercises')
      .select('sets, workout_session_id')
      .in('workout_session_id', 
        await supabase
          .from('workout_sessions')
          .select('id')
          .eq('user_id', user?.id)
          .then(({ data }) => data?.map(session => session.id) || [])
      );

    const totalSets = exerciseData?.reduce((sum, exercise) => sum + (exercise.sets || 0), 0) || 0;

    setStats({
      totalWorkouts: totalWorkouts || 0,
      thisWeekWorkouts: thisWeekWorkouts || 0,
      totalSets,
    });
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message,
      });
    }
  };

  const handleDeletePlan = async (planId: string, planName: string) => {
    try {
      const { error } = await supabase
        .from('workout_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Plan deleted successfully!",
        description: `${planName} has been removed.`,
      });

      fetchWorkoutPlans();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting plan",
        description: error.message,
      });
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

  if (loading) {
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
            <div className="flex items-center">
              <Dumbbell className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-semibold">Fitness Tracker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {profile?.display_name || user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWorkouts}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisWeekWorkouts}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sets</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSets}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <AddWorkoutDialog onWorkoutAdded={fetchData} />
          <CreateWorkoutDialog onWorkoutCreated={fetchData} />
          <UploadPlanDialog onPlanUploaded={fetchData} />
          <ProgressPhotoDialog onPhotoUploaded={fetchData} />
          <WeeklyReportDialog onReportGenerated={fetchData} />
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2" asChild>
            <Link to="/workout-calendar">
              <Calendar className="h-6 w-6" />
              <span>Workout Calendar</span>
            </Link>
          </Button>
        </div>

        {/* Upload July 6 Photos */}
        <div className="mb-8 flex gap-4">
          <UploadSpecificPhotos />
          <DeleteAllPhotos />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Workout Plans */}
          <Card>
            <CardHeader>
              <CardTitle>Workout Plans</CardTitle>
              <CardDescription>Your uploaded workout plans</CardDescription>
            </CardHeader>
            <CardContent>
              {workoutPlans.length === 0 ? (
                <div className="text-center py-8">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No workout plans uploaded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {workoutPlans.map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-medium">{plan.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Uploaded {new Date(plan.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {plan.file_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={plan.file_url} target="_blank" rel="noopener noreferrer">
                              View PDF
                            </a>
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeletePlan(plan.id, plan.name)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Workouts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Workouts</CardTitle>
              <CardDescription>Your latest workout sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentWorkouts.length === 0 ? (
                <div className="text-center py-8">
                  <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No workouts yet. Start your fitness journey!</p>
                  <AddWorkoutDialog onWorkoutAdded={fetchData}>
                    <Button className="mt-4">
                      <Dumbbell className="h-4 w-4 mr-2" />
                      Add Your First Workout
                    </Button>
                  </AddWorkoutDialog>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentWorkouts.map((workout) => (
                    <div key={workout.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge className={getCategoryColor(workout.category)}>
                          {workout.category.toUpperCase()}
                        </Badge>
                        <div>
                          <p className="font-medium">{new Date(workout.date).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {workout.exercises.length} exercises
                            {workout.duration_minutes && ` • ${workout.duration_minutes} min`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {workout.exercises.reduce((total, ex) => total + (ex.sets || 0), 0)} sets
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;