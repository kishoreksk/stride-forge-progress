-- Fix the progressive overload function to handle aggregation properly
CREATE OR REPLACE FUNCTION public.update_exercise_progressive_overload()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    exercise_record RECORD;
    current_max_weight NUMERIC;
    prev_max_weight NUMERIC;
BEGIN
    -- Get the exercise record
    SELECT * INTO exercise_record
    FROM public.exercises
    WHERE id = COALESCE(NEW.exercise_id, OLD.exercise_id);

    -- Only proceed for strength exercises
    IF exercise_record.exercise_type = 'strength' THEN
        -- Get current max weight for this exercise
        SELECT COALESCE(MAX(weight_kg), exercise_record.weight_kg, 0)
        INTO current_max_weight
        FROM public.exercise_sets
        WHERE exercise_id = exercise_record.id;

        -- Find previous max weight using a subquery approach
        WITH previous_exercises AS (
            SELECT e.id, e.weight_kg, ws.date, e.created_at
            FROM public.exercises e
            JOIN public.workout_sessions ws ON e.workout_session_id = ws.id
            WHERE e.exercise_name = exercise_record.exercise_name
            AND ws.user_id = (
                SELECT user_id FROM public.workout_sessions 
                WHERE id = exercise_record.workout_session_id
            )
            AND ws.date < (
                SELECT date FROM public.workout_sessions 
                WHERE id = exercise_record.workout_session_id
            )
            AND e.id != exercise_record.id
            ORDER BY ws.date DESC, e.created_at DESC
            LIMIT 1
        ),
        previous_sets AS (
            SELECT MAX(es.weight_kg) as max_set_weight
            FROM public.exercise_sets es
            WHERE es.exercise_id IN (SELECT id FROM previous_exercises)
        )
        SELECT COALESCE(
            (SELECT max_set_weight FROM previous_sets), 
            (SELECT weight_kg FROM previous_exercises), 
            0
        )
        INTO prev_max_weight;

        -- Update progressive overload fields
        UPDATE public.exercises
        SET 
            previous_weight_kg = CASE WHEN prev_max_weight > 0 THEN prev_max_weight ELSE NULL END,
            is_progressive = CASE 
                WHEN prev_max_weight > 0 AND current_max_weight > prev_max_weight THEN TRUE 
                ELSE FALSE 
            END,
            weight_improvement_kg = CASE 
                WHEN prev_max_weight > 0 AND current_max_weight > prev_max_weight 
                THEN current_max_weight - prev_max_weight 
                ELSE 0 
            END
        WHERE id = exercise_record.id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Also fix the main progressive overload function
CREATE OR REPLACE FUNCTION public.check_progressive_overload_with_sets()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    prev_max_weight NUMERIC;
    current_max_weight NUMERIC;
    prev_session_date DATE;
BEGIN
    -- Only check for strength exercises
    IF NEW.exercise_type = 'strength' THEN
        -- Get the maximum weight from sets for this exercise
        SELECT COALESCE(MAX(weight_kg), 0)
        INTO current_max_weight
        FROM public.exercise_sets
        WHERE exercise_id = NEW.id;

        -- If no sets yet, use the legacy weight_kg field
        IF current_max_weight = 0 THEN
            current_max_weight := COALESCE(NEW.weight_kg, 0);
        END IF;

        -- Find the most recent previous session with the same exercise using a safer approach
        WITH previous_exercises AS (
            SELECT e.id, e.weight_kg, ws.date, e.created_at
            FROM public.exercises e
            JOIN public.workout_sessions ws ON e.workout_session_id = ws.id
            WHERE e.exercise_name = NEW.exercise_name
            AND ws.user_id = (
                SELECT user_id FROM public.workout_sessions 
                WHERE id = NEW.workout_session_id
            )
            AND ws.date < (
                SELECT date FROM public.workout_sessions 
                WHERE id = NEW.workout_session_id
            )
            AND e.id != NEW.id
            ORDER BY ws.date DESC, e.created_at DESC
            LIMIT 1
        ),
        previous_sets AS (
            SELECT MAX(es.weight_kg) as max_set_weight
            FROM public.exercise_sets es
            WHERE es.exercise_id IN (SELECT id FROM previous_exercises)
        )
        SELECT COALESCE(
            (SELECT max_set_weight FROM previous_sets), 
            (SELECT weight_kg FROM previous_exercises), 
            0
        )
        INTO prev_max_weight;

        -- Set progressive overload fields
        IF prev_max_weight IS NOT NULL AND prev_max_weight > 0 THEN
            NEW.previous_weight_kg := prev_max_weight;
            
            IF current_max_weight > prev_max_weight THEN
                NEW.is_progressive := TRUE;
                NEW.weight_improvement_kg := current_max_weight - prev_max_weight;
            ELSE
                NEW.is_progressive := FALSE;
                NEW.weight_improvement_kg := 0;
            END IF;
        ELSE
            -- First time doing this exercise
            NEW.is_progressive := FALSE;
            NEW.previous_weight_kg := NULL;
            NEW.weight_improvement_kg := 0;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;