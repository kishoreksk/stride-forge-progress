-- Add progressive tracking column to exercises table
ALTER TABLE public.exercises 
ADD COLUMN is_progressive BOOLEAN DEFAULT FALSE,
ADD COLUMN previous_weight_kg NUMERIC,
ADD COLUMN weight_improvement_kg NUMERIC;

-- Add index for better performance when checking previous weights
CREATE INDEX idx_exercises_user_exercise_date ON public.exercises 
USING btree (exercise_name, created_at);

-- Create function to automatically detect progressive overload
CREATE OR REPLACE FUNCTION public.check_progressive_overload()
RETURNS TRIGGER AS $$
DECLARE
    prev_weight NUMERIC;
    prev_session_date DATE;
BEGIN
    -- Only check for strength exercises with weight
    IF NEW.exercise_type = 'strength' AND NEW.weight_kg IS NOT NULL THEN
        -- Find the most recent previous session with the same exercise
        SELECT e.weight_kg, ws.date
        INTO prev_weight, prev_session_date
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
        AND e.weight_kg IS NOT NULL
        ORDER BY ws.date DESC, e.created_at DESC
        LIMIT 1;

        -- If we found a previous weight, compare and mark as progressive
        IF prev_weight IS NOT NULL THEN
            NEW.previous_weight_kg := prev_weight;
            
            IF NEW.weight_kg > prev_weight THEN
                NEW.is_progressive := TRUE;
                NEW.weight_improvement_kg := NEW.weight_kg - prev_weight;
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically check progressive overload on insert
CREATE TRIGGER trigger_check_progressive_overload
    BEFORE INSERT ON public.exercises
    FOR EACH ROW
    EXECUTE FUNCTION public.check_progressive_overload();