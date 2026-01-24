// Supabase client configuration for Research Day Scoring

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type for the scores table
export interface ScoreRow {
  id: string;
  presenter_id: string;
  judge_name: string;
  judge_id: string;
  timestamp: string;
  criteria_content_why: number;
  criteria_content_what_how: number;
  criteria_content_next_steps: number;
  criteria_presentation_flow: number;
  criteria_preparedness: number;
  criteria_verbal_comm: number;
  criteria_visual_aids: number;
  weighted_total: number;
  is_no_show: boolean;
  created_at?: string;
}
