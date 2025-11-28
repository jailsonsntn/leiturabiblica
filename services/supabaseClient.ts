import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nmuqsrbalefxwrdyjzag.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tdXFzcmJhbGVmeHdyZHlqemFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjk4ODUsImV4cCI6MjA3OTkwNTg4NX0.STLsU6GCCH0YGW3_22q1kAOP6MtW1KhrDx-6oEzZvrU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);