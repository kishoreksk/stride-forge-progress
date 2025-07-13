-- Remove all workouts from week 2 (July 14-19, 2025)

-- First, delete all exercises for workout sessions in that week
DELETE FROM public.exercises 
WHERE workout_session_id IN (
  SELECT id FROM public.workout_sessions 
  WHERE date >= '2025-07-14' AND date <= '2025-07-19'
);

-- Then, delete the workout sessions for that week
DELETE FROM public.workout_sessions 
WHERE date >= '2025-07-14' AND date <= '2025-07-19';