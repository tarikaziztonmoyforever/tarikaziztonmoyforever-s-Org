/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ccwhlxwwwzbdushehrof.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjd2hseHd3d3piZHVzaGVocm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNTM0MTEsImV4cCI6MjA4NzgyOTQxMX0.JNIkBc6rHBbI-s-cEZeDT_Fk8oB649G3JKnRDjf4M8o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
