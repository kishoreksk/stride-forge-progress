-- Add workouts for the week of July 7, 2025
-- User wants to add completed workouts Monday-Wednesday, Saturday
-- Thursday and Friday are marked as absent (no workout sessions)

-- Monday July 7, 2025 - Push (Chest, Shoulders, Triceps) + Abs
INSERT INTO public.workout_sessions (user_id, date, category, duration_minutes, notes) VALUES 
('6c57382f-7650-44e8-8ced-2d50d7cda768', '2025-07-07', 'push', 90, 'Chest, shoulders, and triceps workout with abs.');

-- Get the session ID for Monday's workout and add exercises
WITH monday_session AS (
    SELECT id FROM public.workout_sessions 
    WHERE user_id = '6c57382f-7650-44e8-8ced-2d50d7cda768' AND date = '2025-07-07'
)
INSERT INTO public.exercises (workout_session_id, exercise_name, exercise_type, sets, reps) 
SELECT id, 'Flat Barbell Bench Press', 'strength'::exercise_type, 4, 12 FROM monday_session
UNION ALL
SELECT id, 'Overhead Shoulder Press', 'strength'::exercise_type, 4, 12 FROM monday_session
UNION ALL
SELECT id, 'Incline Dumbbell Press', 'strength'::exercise_type, 3, 12 FROM monday_session
UNION ALL
SELECT id, 'Lateral Raises', 'strength'::exercise_type, 3, 12 FROM monday_session
UNION ALL
SELECT id, 'Triceps Rope Pushdown', 'strength'::exercise_type, 3, 15 FROM monday_session
UNION ALL
SELECT id, 'Cable Overhead Extension', 'strength'::exercise_type, 3, 15 FROM monday_session
UNION ALL
SELECT id, 'Hanging Leg Raises', 'strength'::exercise_type, 4, 15 FROM monday_session
UNION ALL
SELECT id, 'Plank', 'strength'::exercise_type, 3, 1 FROM monday_session;

-- Tuesday July 8, 2025 - Pull (Back, Biceps) + Abs
INSERT INTO public.workout_sessions (user_id, date, category, duration_minutes, notes) VALUES 
('6c57382f-7650-44e8-8ced-2d50d7cda768', '2025-07-08', 'pull', 85, 'Back and biceps workout with abs.');

WITH tuesday_session AS (
    SELECT id FROM public.workout_sessions 
    WHERE user_id = '6c57382f-7650-44e8-8ced-2d50d7cda768' AND date = '2025-07-08'
)
INSERT INTO public.exercises (workout_session_id, exercise_name, exercise_type, sets, reps) 
SELECT id, 'Deadlifts', 'strength'::exercise_type, 4, 10 FROM tuesday_session
UNION ALL
SELECT id, 'Wide Grip Lat Pulldown', 'strength'::exercise_type, 4, 12 FROM tuesday_session
UNION ALL
SELECT id, 'Barbell Rows', 'strength'::exercise_type, 3, 12 FROM tuesday_session
UNION ALL
SELECT id, 'Seated Cable Rows', 'strength'::exercise_type, 3, 12 FROM tuesday_session
UNION ALL
SELECT id, 'Cable Bicep Curls', 'strength'::exercise_type, 3, 15 FROM tuesday_session
UNION ALL
SELECT id, 'Dumbbell Hammer Curls', 'strength'::exercise_type, 3, 15 FROM tuesday_session
UNION ALL
SELECT id, 'Cable Crunches', 'strength'::exercise_type, 4, 15 FROM tuesday_session
UNION ALL
SELECT id, 'Russian Twists', 'strength'::exercise_type, 3, 20 FROM tuesday_session;

-- Wednesday July 9, 2025 - Legs (Quads, Hamstrings, Glutes, Calves) + Abs
INSERT INTO public.workout_sessions (user_id, date, category, duration_minutes, notes) VALUES 
('6c57382f-7650-44e8-8ced-2d50d7cda768', '2025-07-09', 'legs', 95, 'Legs and lower body workout with abs.');

WITH wednesday_session AS (
    SELECT id FROM public.workout_sessions 
    WHERE user_id = '6c57382f-7650-44e8-8ced-2d50d7cda768' AND date = '2025-07-09'
)
INSERT INTO public.exercises (workout_session_id, exercise_name, exercise_type, sets, reps) 
SELECT id, 'Barbell Squats', 'strength'::exercise_type, 4, 12 FROM wednesday_session
UNION ALL
SELECT id, 'Leg Extension', 'strength'::exercise_type, 3, 12 FROM wednesday_session
UNION ALL
SELECT id, 'Walking Lunges', 'strength'::exercise_type, 3, 12 FROM wednesday_session
UNION ALL
SELECT id, 'Leg Press', 'strength'::exercise_type, 3, 15 FROM wednesday_session
UNION ALL
SELECT id, 'Leg Curl', 'strength'::exercise_type, 3, 12 FROM wednesday_session
UNION ALL
SELECT id, 'Dumbbell Romanian Deadlift', 'strength'::exercise_type, 3, 15 FROM wednesday_session
UNION ALL
SELECT id, 'Calf Raises', 'strength'::exercise_type, 3, 15 FROM wednesday_session
UNION ALL
SELECT id, 'Weighted Sit-ups', 'strength'::exercise_type, 4, 15 FROM wednesday_session
UNION ALL
SELECT id, 'Flutter Kicks', 'strength'::exercise_type, 3, 30 FROM wednesday_session;

-- Saturday July 12, 2025 - Abs + Cardio
INSERT INTO public.workout_sessions (user_id, date, category, duration_minutes, notes) VALUES 
('6c57382f-7650-44e8-8ced-2d50d7cda768', '2025-07-12', 'abs', 60, 'Abs focused workout with HIIT treadmill session.');

WITH saturday_session AS (
    SELECT id FROM public.workout_sessions 
    WHERE user_id = '6c57382f-7650-44e8-8ced-2d50d7cda768' AND date = '2025-07-12'
)
INSERT INTO public.exercises (workout_session_id, exercise_name, exercise_type, sets, reps) 
SELECT id, 'Hip Thrusts', 'strength'::exercise_type, 4, 15 FROM saturday_session
UNION ALL
SELECT id, 'Cable Crunches', 'strength'::exercise_type, 3, 15 FROM saturday_session
UNION ALL
SELECT id, 'Hanging Leg Raise', 'strength'::exercise_type, 3, 15 FROM saturday_session
UNION ALL
SELECT id, 'V-Ups', 'strength'::exercise_type, 3, 15 FROM saturday_session
UNION ALL
SELECT id, 'Plank', 'strength'::exercise_type, 3, 1 FROM saturday_session
UNION ALL
SELECT id, 'Treadmill HIIT', 'cardio'::exercise_type, 1, 1 FROM saturday_session;