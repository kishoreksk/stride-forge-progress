-- Add function to duplicate workout schedules for multiple weeks
CREATE OR REPLACE FUNCTION public.duplicate_workout_schedule(
  p_user_id UUID,
  p_source_week_start DATE,
  p_target_weeks INTEGER DEFAULT 6
) RETURNS JSON AS $$
DECLARE
  source_session RECORD;
  source_exercise RECORD;
  source_set RECORD;
  new_session_id UUID;
  new_exercise_id UUID;
  target_date DATE;
  week_offset INTEGER;
  result_data JSON;
BEGIN
  -- Create an array to store results
  result_data := '[]'::JSON;
  
  -- Loop through each target week
  FOR week_offset IN 1..p_target_weeks LOOP
    -- For each workout session in the source week
    FOR source_session IN 
      SELECT * FROM workout_sessions 
      WHERE user_id = p_user_id 
      AND date >= p_source_week_start 
      AND date < p_source_week_start + INTERVAL '7 days'
      ORDER BY date
    LOOP
      -- Calculate target date (same day of week, but in target week)
      target_date := source_session.date + (week_offset * INTERVAL '7 days');
      
      -- Skip if workout already exists for this date
      IF EXISTS (
        SELECT 1 FROM workout_sessions 
        WHERE user_id = p_user_id AND date = target_date
      ) THEN
        CONTINUE;
      END IF;
      
      -- Create new workout session
      INSERT INTO workout_sessions (
        user_id, date, category, duration_minutes, notes, workout_plan_id
      ) VALUES (
        p_user_id, target_date, source_session.category, 
        source_session.duration_minutes, source_session.notes, 
        source_session.workout_plan_id
      ) RETURNING id INTO new_session_id;
      
      -- Copy exercises
      FOR source_exercise IN
        SELECT * FROM exercises WHERE workout_session_id = source_session.id
      LOOP
        INSERT INTO exercises (
          workout_session_id, exercise_name, exercise_type, sets, reps, 
          weight_kg, notes, laps, time_minutes, distance_km
        ) VALUES (
          new_session_id, source_exercise.exercise_name, source_exercise.exercise_type,
          source_exercise.sets, source_exercise.reps, source_exercise.weight_kg,
          source_exercise.notes, source_exercise.laps, source_exercise.time_minutes,
          source_exercise.distance_km
        ) RETURNING id INTO new_exercise_id;
        
        -- Copy exercise sets
        FOR source_set IN
          SELECT * FROM exercise_sets WHERE exercise_id = source_exercise.id
        LOOP
          INSERT INTO exercise_sets (
            exercise_id, set_number, reps, weight_kg
          ) VALUES (
            new_exercise_id, source_set.set_number, source_set.reps, source_set.weight_kg
          );
        END LOOP;
      END LOOP;
      
      -- Add to result
      result_data := result_data::JSONB || jsonb_build_object(
        'week', week_offset,
        'date', target_date,
        'category', source_session.category,
        'session_id', new_session_id
      );
    END LOOP;
  END LOOP;
  
  RETURN result_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;