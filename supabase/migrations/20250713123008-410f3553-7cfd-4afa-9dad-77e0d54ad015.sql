-- WEEK 5 (August 4-10, 2025)

-- Monday August 4, 2025 - Push
INSERT INTO public.workout_sessions (user_id, date, category, duration_minutes, notes) VALUES 
('6c57382f-7650-44e8-8ced-2d50d7cda768', '2025-08-04', 'push', 90, 'Chest, shoulders, and triceps workout with abs.');

WITH session_0804 AS (SELECT id FROM public.workout_sessions WHERE user_id = '6c57382f-7650-44e8-8ced-2d50d7cda768' AND date = '2025-08-04')
INSERT INTO public.exercises (workout_session_id, exercise_name, exercise_type, sets, reps) 
SELECT id, 'Flat Barbell Bench Press', 'strength'::exercise_type, 4, 12 FROM session_0804
UNION ALL SELECT id, 'Overhead Shoulder Press', 'strength'::exercise_type, 4, 12 FROM session_0804
UNION ALL SELECT id, 'Incline Dumbbell Press', 'strength'::exercise_type, 3, 12 FROM session_0804
UNION ALL SELECT id, 'Lateral Raises', 'strength'::exercise_type, 3, 12 FROM session_0804
UNION ALL SELECT id, 'Triceps Rope Pushdown', 'strength'::exercise_type, 3, 15 FROM session_0804
UNION ALL SELECT id, 'Cable Overhead Extension', 'strength'::exercise_type, 3, 15 FROM session_0804
UNION ALL SELECT id, 'Hanging Leg Raises', 'strength'::exercise_type, 4, 15 FROM session_0804
UNION ALL SELECT id, 'Plank', 'strength'::exercise_type, 3, 1 FROM session_0804;

-- Tuesday August 5, 2025 - Pull
INSERT INTO public.workout_sessions (user_id, date, category, duration_minutes, notes) VALUES 
('6c57382f-7650-44e8-8ced-2d50d7cda768', '2025-08-05', 'pull', 85, 'Back and biceps workout with abs.');

WITH session_0805 AS (SELECT id FROM public.workout_sessions WHERE user_id = '6c57382f-7650-44e8-8ced-2d50d7cda768' AND date = '2025-08-05')
INSERT INTO public.exercises (workout_session_id, exercise_name, exercise_type, sets, reps) 
SELECT id, 'Deadlifts', 'strength'::exercise_type, 4, 10 FROM session_0805
UNION ALL SELECT id, 'Wide Grip Lat Pulldown', 'strength'::exercise_type, 4, 12 FROM session_0805
UNION ALL SELECT id, 'Barbell Rows', 'strength'::exercise_type, 3, 12 FROM session_0805
UNION ALL SELECT id, 'Seated Cable Rows', 'strength'::exercise_type, 3, 12 FROM session_0805
UNION ALL SELECT id, 'Cable Bicep Curls', 'strength'::exercise_type, 3, 15 FROM session_0805
UNION ALL SELECT id, 'Dumbbell Hammer Curls', 'strength'::exercise_type, 3, 15 FROM session_0805
UNION ALL SELECT id, 'Cable Crunches', 'strength'::exercise_type, 4, 15 FROM session_0805
UNION ALL SELECT id, 'Russian Twists', 'strength'::exercise_type, 3, 20 FROM session_0805;

-- Wednesday August 6, 2025 - Legs
INSERT INTO public.workout_sessions (user_id, date, category, duration_minutes, notes) VALUES 
('6c57382f-7650-44e8-8ced-2d50d7cda768', '2025-08-06', 'legs', 95, 'Legs and lower body workout with abs.');

WITH session_0806 AS (SELECT id FROM public.workout_sessions WHERE user_id = '6c57382f-7650-44e8-8ced-2d50d7cda768' AND date = '2025-08-06')
INSERT INTO public.exercises (workout_session_id, exercise_name, exercise_type, sets, reps) 
SELECT id, 'Barbell Squats', 'strength'::exercise_type, 4, 12 FROM session_0806
UNION ALL SELECT id, 'Leg Extension', 'strength'::exercise_type, 3, 12 FROM session_0806
UNION ALL SELECT id, 'Walking Lunges', 'strength'::exercise_type, 3, 12 FROM session_0806
UNION ALL SELECT id, 'Leg Press', 'strength'::exercise_type, 3, 15 FROM session_0806
UNION ALL SELECT id, 'Leg Curl', 'strength'::exercise_type, 3, 12 FROM session_0806
UNION ALL SELECT id, 'Dumbbell Romanian Deadlift', 'strength'::exercise_type, 3, 15 FROM session_0806
UNION ALL SELECT id, 'Calf Raises', 'strength'::exercise_type, 3, 15 FROM session_0806
UNION ALL SELECT id, 'Weighted Sit-ups', 'strength'::exercise_type, 4, 15 FROM session_0806
UNION ALL SELECT id, 'Flutter Kicks', 'strength'::exercise_type, 3, 30 FROM session_0806;

-- Thursday August 7, 2025 - Push
INSERT INTO public.workout_sessions (user_id, date, category, duration_minutes, notes) VALUES 
('6c57382f-7650-44e8-8ced-2d50d7cda768', '2025-08-07', 'push', 85, 'Chest, shoulders, and triceps workout with abs.');

WITH session_0807 AS (SELECT id FROM public.workout_sessions WHERE user_id = '6c57382f-7650-44e8-8ced-2d50d7cda768' AND date = '2025-08-07')
INSERT INTO public.exercises (workout_session_id, exercise_name, exercise_type, sets, reps) 
SELECT id, 'Dumbbell Bench Press', 'strength'::exercise_type, 4, 12 FROM session_0807
UNION ALL SELECT id, 'Arnold Press', 'strength'::exercise_type, 3, 12 FROM session_0807
UNION ALL SELECT id, 'Decline Barbell Press', 'strength'::exercise_type, 3, 12 FROM session_0807
UNION ALL SELECT id, 'Cable Chest Fly', 'strength'::exercise_type, 3, 12 FROM session_0807
UNION ALL SELECT id, 'Dumbbell Lateral Raises', 'strength'::exercise_type, 4, 15 FROM session_0807
UNION ALL SELECT id, 'Skull Crushers', 'strength'::exercise_type, 3, 12 FROM session_0807
UNION ALL SELECT id, 'Cable Rope Extension', 'strength'::exercise_type, 3, 15 FROM session_0807
UNION ALL SELECT id, 'Reverse Crunches', 'strength'::exercise_type, 3, 15 FROM session_0807
UNION ALL SELECT id, 'Side Plank', 'strength'::exercise_type, 3, 1 FROM session_0807;

-- Friday August 8, 2025 - Pull
INSERT INTO public.workout_sessions (user_id, date, category, duration_minutes, notes) VALUES 
('6c57382f-7650-44e8-8ced-2d50d7cda768', '2025-08-08', 'pull', 75, 'Back and biceps workout with abs.');

WITH session_0808 AS (SELECT id FROM public.workout_sessions WHERE user_id = '6c57382f-7650-44e8-8ced-2d50d7cda768' AND date = '2025-08-08')
INSERT INTO public.exercises (workout_session_id, exercise_name, exercise_type, sets, reps) 
SELECT id, 'Incline Dumbbell Row', 'strength'::exercise_type, 4, 12 FROM session_0808
UNION ALL SELECT id, 'Close Grip Lat Pulldown', 'strength'::exercise_type, 4, 12 FROM session_0808
UNION ALL SELECT id, 'Face Pulls', 'strength'::exercise_type, 3, 15 FROM session_0808
UNION ALL SELECT id, 'Dumbbell Hammer Curls', 'strength'::exercise_type, 3, 15 FROM session_0808
UNION ALL SELECT id, 'EZ Bar Curls', 'strength'::exercise_type, 3, 12 FROM session_0808
UNION ALL SELECT id, 'Ab Wheel Rollouts', 'strength'::exercise_type, 4, 10 FROM session_0808
UNION ALL SELECT id, 'Oblique V-Ups', 'strength'::exercise_type, 3, 12 FROM session_0808;

-- Saturday August 9, 2025 - Abs
INSERT INTO public.workout_sessions (user_id, date, category, duration_minutes, notes) VALUES 
('6c57382f-7650-44e8-8ced-2d50d7cda768', '2025-08-09', 'abs', 60, 'Abs focused workout with HIIT treadmill session.');

WITH session_0809 AS (SELECT id FROM public.workout_sessions WHERE user_id = '6c57382f-7650-44e8-8ced-2d50d7cda768' AND date = '2025-08-09')
INSERT INTO public.exercises (workout_session_id, exercise_name, exercise_type, sets, reps) 
SELECT id, 'Hip Thrusts', 'strength'::exercise_type, 4, 15 FROM session_0809
UNION ALL SELECT id, 'Cable Crunches', 'strength'::exercise_type, 3, 15 FROM session_0809
UNION ALL SELECT id, 'Hanging Leg Raise', 'strength'::exercise_type, 3, 15 FROM session_0809
UNION ALL SELECT id, 'V-Ups', 'strength'::exercise_type, 3, 15 FROM session_0809
UNION ALL SELECT id, 'Plank', 'strength'::exercise_type, 3, 1 FROM session_0809
UNION ALL SELECT id, 'Treadmill HIIT', 'cardio'::exercise_type, 1, 1 FROM session_0809;