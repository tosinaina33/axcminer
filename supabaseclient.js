// supabaseClient.js
import { createClient } from "https://esm.sh/@supabase/supabase-js";

export const SUPABASE_URL = "https://hclomwxpwcxgnptbidnx.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbG9td3hwd2N4Z25wdGJpZG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NzYxODAsImV4cCI6MjA3MzU1MjE4MH0.9mIgiLz_jVGj6QJ8hV2ocMK9bFDwym1cMEQeSx9pxIc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);