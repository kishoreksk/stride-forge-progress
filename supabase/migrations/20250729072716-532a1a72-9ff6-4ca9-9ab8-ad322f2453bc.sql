-- Create table for tracking absent days
CREATE TABLE public.absent_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.absent_days ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own absent days" 
ON public.absent_days 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own absent days" 
ON public.absent_days 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own absent days" 
ON public.absent_days 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own absent days" 
ON public.absent_days 
FOR DELETE 
USING (auth.uid() = user_id);