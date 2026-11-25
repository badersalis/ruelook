import { createClient } from "@supabase/supabase-js";
import { config } from "@/lib/config";
import type { Database } from "./database.types";

export const supabase = createClient<Database>(config.supabaseUrl, config.supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
