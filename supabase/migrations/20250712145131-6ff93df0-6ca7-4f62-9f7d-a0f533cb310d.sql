-- Create profile for the user
INSERT INTO public.profiles (user_id, display_name)
VALUES ('6c57382f-7650-44e8-8ced-2d50d7cda768', 'Kishore KS')
ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  updated_at = now();