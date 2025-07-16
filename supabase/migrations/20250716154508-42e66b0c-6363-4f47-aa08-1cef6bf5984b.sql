
-- Add Thursday July 17, 2025 - Push workout
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

-- Add Friday July 18, 2025 - Pull workout
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
