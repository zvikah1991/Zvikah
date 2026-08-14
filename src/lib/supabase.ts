import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

// אין כאן generic מבוסס Database: הפרויקט אינו מריץ `supabase gen types` באופן
// אוטומטי, ולכן הטיפוסים הייעודיים בכל שאילתה (types/database.ts + as Type)
// הם מקור האמת, במקום generic חלקי שגורם להסקת never שגויה.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
