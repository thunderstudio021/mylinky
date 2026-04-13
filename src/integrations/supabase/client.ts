import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://duotsmeomtykyjzmidqq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1b3RzbWVvbXR5a3lqem1pZHFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzE5NDMsImV4cCI6MjA4ODQwNzk0M30.on2mp4y8ZH1NpmpzrWzxzmx34Ve9_0l6c4c8pn8lhc4";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
