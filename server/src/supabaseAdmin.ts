import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

// Client com service_role — bypassa RLS, use apenas no backend
export const supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
