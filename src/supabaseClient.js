import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mdxqixuwpziwosfvidoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1keHFpeHV3cHppd29zZnZpZG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NjIxMDYsImV4cCI6MjA2NDIzODEwNn0.HFCTtBXEBrelgQZW521lf3HoLvSmXxZsICyc7AvPrz0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);