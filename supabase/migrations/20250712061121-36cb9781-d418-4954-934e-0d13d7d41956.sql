-- Clean up all data from the database tables
-- Delete in correct order due to foreign key constraints

-- First delete exercises (references workout_sessions)
DELETE FROM public.exercises;

-- Then delete workout sessions
DELETE FROM public.workout_sessions;

-- Delete progress photos
DELETE FROM public.progress_photos;

-- Delete workout plans
DELETE FROM public.workout_plans;

-- Delete profiles (keep this last as other tables might reference users)
DELETE FROM public.profiles;