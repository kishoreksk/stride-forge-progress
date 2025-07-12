-- Create enum types for workout categories
CREATE TYPE public.workout_category AS ENUM ('push', 'pull', 'legs', 'abs', 'cardio', 'treadmill');

CREATE TYPE public.exercise_type AS ENUM ('strength', 'cardio');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout plans table for uploaded PDF plans
CREATE TABLE public.workout_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout sessions table
CREATE TABLE public.workout_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  category public.workout_category NOT NULL,
  notes TEXT,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exercises table
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  exercise_type public.exercise_type NOT NULL DEFAULT 'strength',
  sets INTEGER,
  reps INTEGER,
  weight_kg DECIMAL(5,2),
  distance_km DECIMAL(5,2),
  time_minutes INTEGER,
  laps INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create progress photos table
CREATE TABLE public.progress_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  week_start_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for workout plans
CREATE POLICY "Users can view their own workout plans" 
ON public.workout_plans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout plans" 
ON public.workout_plans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout plans" 
ON public.workout_plans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout plans" 
ON public.workout_plans 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for workout sessions
CREATE POLICY "Users can view their own workout sessions" 
ON public.workout_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout sessions" 
ON public.workout_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout sessions" 
ON public.workout_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout sessions" 
ON public.workout_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for exercises
CREATE POLICY "Users can view exercises from their workout sessions" 
ON public.exercises 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.workout_sessions 
    WHERE workout_sessions.id = exercises.workout_session_id 
    AND workout_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create exercises for their workout sessions" 
ON public.exercises 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workout_sessions 
    WHERE workout_sessions.id = exercises.workout_session_id 
    AND workout_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update exercises from their workout sessions" 
ON public.exercises 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.workout_sessions 
    WHERE workout_sessions.id = exercises.workout_session_id 
    AND workout_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete exercises from their workout sessions" 
ON public.exercises 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.workout_sessions 
    WHERE workout_sessions.id = exercises.workout_session_id 
    AND workout_sessions.user_id = auth.uid()
  )
);

-- Create policies for progress photos
CREATE POLICY "Users can view their own progress photos" 
ON public.progress_photos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress photos" 
ON public.progress_photos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress photos" 
ON public.progress_photos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress photos" 
ON public.progress_photos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('workout-plans', 'workout-plans', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('progress-photos', 'progress-photos', false);

-- Create storage policies for workout plans
CREATE POLICY "Users can view their own workout plan files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'workout-plans' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own workout plan files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'workout-plans' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own workout plan files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'workout-plans' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for progress photos
CREATE POLICY "Users can view their own progress photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own progress photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own progress photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workout_plans_updated_at
  BEFORE UPDATE ON public.workout_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workout_sessions_updated_at
  BEFORE UPDATE ON public.workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();