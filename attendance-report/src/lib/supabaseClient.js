import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qikbvdrwkleflbtihycr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpa2J2ZHJ3a2xlZmxidGloeWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MTQxNzksImV4cCI6MjA3MjE5MDE3OX0.-Wp_l4Z-PeZBf9PevMXflp-a15pKT23jjFY-omXOXbI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
