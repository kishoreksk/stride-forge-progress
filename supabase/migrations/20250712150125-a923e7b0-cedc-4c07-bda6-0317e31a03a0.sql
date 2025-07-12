-- Create exercise_sets table to track individual sets
CREATE TABLE public.exercise_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_kg NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(exercise_id, set_number)
);

-- Enable RLS on exercise_sets
ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for exercise_sets (inherit from exercises)
CREATE POLICY "Users can view sets from their exercises" 
ON public.exercise_sets 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.exercises e
  JOIN public.workout_sessions ws ON e.workout_session_id = ws.id
  WHERE e.id = exercise_sets.exercise_id AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can create sets for their exercises" 
ON public.exercise_sets 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.exercises e
  JOIN public.workout_sessions ws ON e.workout_session_id = ws.id
  WHERE e.id = exercise_sets.exercise_id AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can update sets from their exercises" 
ON public.exercise_sets 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.exercises e
  JOIN public.workout_sessions ws ON e.workout_session_id = ws.id
  WHERE e.id = exercise_sets.exercise_id AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can delete sets from their exercises" 
ON public.exercise_sets 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.exercises e
  JOIN public.workout_sessions ws ON e.workout_session_id = ws.id
  WHERE e.id = exercise_sets.exercise_id AND ws.user_id = auth.uid()
));

-- Update the progressive overload function to work with sets
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

        -- Find the most recent previous session with the same exercise
        SELECT COALESCE(MAX(es.weight_kg), e.weight_kg, 0), ws.date
        INTO prev_max_weight, prev_session_date
        FROM public.exercises e
        JOIN public.workout_sessions ws ON e.workout_session_id = ws.id
        LEFT JOIN public.exercise_sets es ON e.id = es.exercise_id
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
        LIMIT 1;

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

-- Create trigger for the new function
CREATE TRIGGER check_progressive_overload_with_sets_trigger
BEFORE INSERT OR UPDATE ON public.exercises
FOR EACH ROW
EXECUTE FUNCTION public.check_progressive_overload_with_sets();

-- Create function to update progressive overload when sets are modified
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

        -- Find previous max weight
        SELECT COALESCE(MAX(es.weight_kg), e.weight_kg, 0)
        INTO prev_max_weight
        FROM public.exercises e
        JOIN public.workout_sessions ws ON e.workout_session_id = ws.id
        LEFT JOIN public.exercise_sets es ON e.id = es.exercise_id
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
        LIMIT 1;

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

-- Create triggers for exercise_sets changes
CREATE TRIGGER update_progressive_overload_on_sets_change
AFTER INSERT OR UPDATE OR DELETE ON public.exercise_sets
FOR EACH ROW
EXECUTE FUNCTION public.update_exercise_progressive_overload();