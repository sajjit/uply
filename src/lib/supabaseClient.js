import { createClient } from '@supabase/supabase-js';

// Uply — Supabase configuration
// The publishable key is safe to expose in frontend code; data access is
// protected by Row Level Security policies configured in the database.
//
// Reads from VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY when set (e.g.
// a staging Supabase project for local dev and Vercel Preview deployments),
// falling back to the production project so Production deploys keep working
// with no env vars configured.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://pshdavkhanvulttsnygx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_Tq3mBcgHtZeja0Uln4bglg_HN92FXF1";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
