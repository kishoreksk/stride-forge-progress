-- Create table for shared weekly reports
CREATE TABLE public.shared_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start_date DATE NOT NULL,
  share_token TEXT NOT NULL UNIQUE,
  title TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for comments on shared reports
CREATE TABLE public.report_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shared_report_id UUID NOT NULL REFERENCES public.shared_reports(id) ON DELETE CASCADE,
  commenter_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for shared_reports
CREATE POLICY "Users can create their own shared reports" 
ON public.shared_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own shared reports" 
ON public.shared_reports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own shared reports" 
ON public.shared_reports 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared reports" 
ON public.shared_reports 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for report_comments (allow public read/write on comments)
CREATE POLICY "Anyone can view comments" 
ON public.report_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can add comments" 
ON public.report_comments 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for updating timestamps
CREATE TRIGGER update_shared_reports_updated_at
BEFORE UPDATE ON public.shared_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();