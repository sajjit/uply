import { createClient } from '@supabase/supabase-js';

// Uply — Supabase configuration
// The publishable key is safe to expose in frontend code; data access is
// protected by Row Level Security policies configured in the database.

const SUPABASE_URL = "https://pshdavkhanvulttsnygx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Tq3mBcgHtZeja0Uln4bglg_HN92FXF1";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
