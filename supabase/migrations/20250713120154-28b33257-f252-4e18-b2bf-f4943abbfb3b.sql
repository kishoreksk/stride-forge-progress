-- Clean up all exercise data from the database
-- Delete in correct order due to foreign key constraints

-- First delete exercise sets (references exercises)
DELETE FROM public.exercise_sets;

-- Then delete exercises
DELETE FROM public.exercises;