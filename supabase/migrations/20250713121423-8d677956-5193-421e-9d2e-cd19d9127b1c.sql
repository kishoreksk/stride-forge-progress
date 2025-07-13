-- Add workout plan for the next 4 weeks (July 14 - August 10, 2025)
-- Week 2: July 14-20, 2025
-- Week 3: July 21-27, 2025  
-- Week 4: July 28 - August 3, 2025
-- Week 5: August 4-10, 2025

-- WEEK 2 (July 14-20, 2025)

-- Monday July 14, 2025 - Push
INSERT INTO public.workout_sessions (user_id, date, category, duration_minutes, notes) VALUES 
('6c57382f-7650-44e8-8ced-2d50d7cda768', '2025-07-14', 'push', 90, 'Chest, shoulders, and triceps workout with abs.');

WITH session_0714 AS (SELECT id FROM public.workout_sessions WHERE user_id = '6c57382f-7650-44e8-8ced-2d50d7cda768' AND date = '2025-07-14')
INSERT INTO public.exercises (workout_session_id, exercise_name, exercise_type, sets, reps) 
SELECT id, 'Flat Barbell Bench Press', 'strength'::exercise_type, 4, 12 FROM session_0714
UNION ALL SELECT id, 'Overhead Shoulder Press', 'strength'::exercise_type, 4, 12 FROM session_0714
UNION ALL SELECT id, 'Incline Dumbbell Press', 'strength'::exercise_type, 3, 12 FROM session_0714
UNION ALL SELECT id, 'Lateral Raises', 'strength'::exercise_type, 3, 12 FROM session_0714
UNION ALL SELECT id, 'Triceps Rope Pushdown', 'strength'::exercise_type, 3, 15 FROM session_0714
UNION ALL SELECT id, 'Cable Overhead Extension', 'strength'::exercise_type, 3, 15 FROM session_0714
UNION ALL SELECT id, 'Hanging Leg Raises', 'strength'::exercise_type, 4, 15 FROM session_0714
UNION ALL SELECT id, 'Plank', 'strength'::exercise_type, 3, 1 FROM session_0714;

-- Tuesday July 15, 2025 - Pull
INSERT INTO public.workout_sessions (user_id, date, category, duration_minutes, notes) VALUES 
('6c57382f-7650-44e8-8ced-2d50d7cda768', '2025-07-15', 'pull', 85, 'Back and biceps workout with abs.');

WITH session_0715 AS (SELECT id FROM public.workout_sessions WHERE user_id = '6c57382f-7650-44e8-8ced-2d50d7cda768' AND date = '2025-07-15')
INSERT INTO public.exercises (workout_session_id, exercise_name, exercise_type, sets, reps) 
SELECT id, 'Deadlifts', 'strength'::exercise_type, 4, 10 FROM session_0715
UNION ALL SELECT id, 'Wide Grip Lat Pulldown', 'strength'::exercise_type, 4, 12 FROM session_0715
UNION ALL SELECT id, 'Barbell Rows', 'strength'::exercise_type, 3, 12 FROM session_0715
UNION ALL SELECT id, 'Seated Cable Rows', 'strength'::exercise_type, 3, 12 FROM session_0715
UNION ALL SELECT id, 'Cable Bicep Curls', 'strength'::exercise_type, 3, 15 FROM session_0715
UNION ALL SELECT id, 'Dumbbell Hammer Curls', 'strength'::exercise_type, 3, 15 FROM session_0715
UNION ALL SELECT id, 'Cable Crunches', 'strength'::exercise_type, 4, 15 FROM session_0715
UNION ALL SELECT id, 'Russian Twists', 'strength'::exercise_type, 3, 20 FROM session_0715;

-- Wednesday July 16, 2025 - Legs
INSERT INTO public.workout_sessions (user_id, date, category, duration_minutes, notes) VALUES 
('6c57382f-7650-44e8-8ced-2d50d7cda768', '2025-07-16', 'legs', 95, 'Legs and lower body workout with abs.');

WITH session_0716 AS (SELECT id FROM public.workout_sessions WHERE user_id = '6c57382f-7650-44e8-8ced-2d50d7cda768' AND date = '2025-07-16')
INSERT INTO public.exercises (workout_session_id, exercise_name, exercise_type, sets, reps) 
SELECT id, 'Barbell Squats', 'strength'::exercise_type, 4, 12 FROM session_0716
UNION ALL SELECT id, 'Leg Extension', 'strength'::exercise_type, 3, 12 FROM session_0716
UNION ALL SELECT id, 'Walking Lunges', 'strength'::exercise_type, 3, 12 FROM session_0716
UNION ALL SELECT id, 'Leg Press', 'strength'::exercise_type, 3, 15 FROM session_0716
UNION ALL SELECT id, 'Leg Curl', 'strength'::exercise_type, 3, 12 FROM session_0716
UNION ALL SELECT id, 'Dumbbell Romanian Deadlift', 'strength'::exercise_type, 3, 15 FROM session_0716
UNION ALL SELECT id, 'Calf Raises', 'strength'::exercise_type, 3, 15 FROM session_0716
UNION ALL SELECT id, 'Weighted Sit-ups', 'strength'::exercise_type, 4, 15 FROM session_0716
UNION ALL SELECT id, 'Flutter Kicks', 'strength'::exercise_type, 3, 30 FROM session_0716;

-- Thursday July 17, 2025 - Push
INSERT INTO public.workout_sessions (user_id, date, category, duration_minutes, notes) VALUES 
('6c57382f-7650-44e8-8ced-2d50d7cda768', '2025-07-17', 'push', 85, 'Chest, shoulders, and triceps workout with abs.');

WITH session_0717 AS (SELECT id FROM public.workout_sessions WHERE user_id = '6c57382f-7650-44e8-8ced-2d50d7cda768' AND date = '2025-07-17')
INSERT INTO public.exercises (workout_session_id, exercise_name, exercise_type, sets, reps) 
SELECT id, 'Dumbbell Bench Press', 'strength'::exercise_type, 4, 12 FROM session_0717
UNION ALL SELECT id, 'Arnold Press', 'strength'::exercise_type, 3, 12 FROM session_0717
UNION ALL SELECT id, 'Decline Barbell Press', 'strength'::exercise_type, 3, 12 FROM session_0717
UNION ALL SELECT id, 'Cable Chest Fly', 'strength'::exercise_type, 3, 12 FROM session_0717
UNION ALL SELECT id, 'Dumbbell Lateral Raises', 'strength'::exercise_type, 4, 15 FROM session_0717
UNION ALL SELECT id, 'Skull Crushers', 'strength'::exercise_type, 3, 12 FROM session_0717
UNION ALL SELECT id, 'Cable Rope Extension', 'strength'::exercise_type, 3, 15 FROM session_0717
UNION ALL SELECT id, 'Reverse Crunches', 'strength'::exercise_type, 3, 15 FROM session_0717
UNION ALL SELECT id, 'Side Plank', 'strength'::exercise_type, 3, 1 FROM session_0717;

-- Friday July 18, 2025 - Pull
INSERT INTO public.workout_sessions (user_id, date, category, duration_minutes, notes) VALUES 
('6c57382f-7650-44e8-8ced-2d50d7cda768', '2025-07-18', 'pull', 75, 'Back and biceps workout with abs.');

WITH session_0718 AS (SELECT id FROM public.workout_sessions WHERE user_id = '6c57382f-7650-44e8-8ced-2d50d7cda768' AND date = '2025-07-18')
INSERT INTO public.exercises (workout_session_id, exercise_name, exercise_type, sets, reps) 
SELECT id, 'Incline Dumbbell Row', 'strength'::exercise_type, 4, 12 FROM session_0718
UNION ALL SELECT id, 'Close Grip Lat Pulldown', 'strength'::exercise_type, 4, 12 FROM session_0718
UNION ALL SELECT id, 'Face Pulls', 'strength'::exercise_type, 3, 15 FROM session_0718
UNION ALL SELECT id, 'Dumbbell Hammer Curls', 'strength'::exercise_type, 3, 15 FROM session_0718
UNION ALL SELECT id, 'EZ Bar Curls', 'strength'::exercise_type, 3, 12 FROM session_0718
UNION ALL SELECT id, 'Ab Wheel Rollouts', 'strength'::exercise_type, 4, 10 FROM session_0718
UNION ALL SELECT id, 'Oblique V-Ups', 'strength'::exercise_type, 3, 12 FROM session_0718;

-- Saturday July 19, 2025 - Abs
INSERT INTO public.workout_sessions (user_id, date, category, duration_minutes, notes) VALUES 
('6c57382f-7650-44e8-8ced-2d50d7cda768', '2025-07-19', 'abs', 60, 'Abs focused workout with HIIT treadmill session.');

WITH session_0719 AS (SELECT id FROM public.workout_sessions WHERE user_id = '6c57382f-7650-44e8-8ced-2d50d7cda768' AND date = '2025-07-19')
INSERT INTO public.exercises (workout_session_id, exercise_name, exercise_type, sets, reps) 
SELECT id, 'Hip Thrusts', 'strength'::exercise_type, 4, 15 FROM session_0719
UNION ALL SELECT id, 'Cable Crunches', 'strength'::exercise_type, 3, 15 FROM session_0719
UNION ALL SELECT id, 'Hanging Leg Raise', 'strength'::exercise_type, 3, 15 FROM session_0719
UNION ALL SELECT id, 'V-Ups', 'strength'::exercise_type, 3, 15 FROM session_0719
UNION ALL SELECT id, 'Plank', 'strength'::exercise_type, 3, 1 FROM session_0719
UNION ALL SELECT id, 'Treadmill HIIT', 'cardio'::exercise_type, 1, 1 FROM session_0719;