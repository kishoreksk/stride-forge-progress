// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://eewlouxtzogkeisckwyb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVld2xvdXh0em9na2Vpc2Nrd3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyOTcwMDgsImV4cCI6MjA2Nzg3MzAwOH0.Z0_FDb-weSEWNzW2R-irof_BNB9NuNyIZby37jQKkhw";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});