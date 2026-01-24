// API route for scores - handles saving and retrieving scores from Supabase

import { NextRequest, NextResponse } from 'next/server';
import { supabase, ScoreRow } from '@/lib/supabase';
import { Score } from '@/lib/types';

// Convert app Score type to database row
function scoreToRow(score: Score): ScoreRow {
  return {
    id: score.id,
    presenter_id: score.presenterId,
    judge_name: score.judgeName,
    judge_id: score.judgeId,
    timestamp: score.timestamp,
    criteria_content_why: score.criteria.contentWhy,
    criteria_content_what_how: score.criteria.contentWhatHow,
    criteria_content_next_steps: score.criteria.contentNextSteps,
    criteria_presentation_flow: score.criteria.presentationFlow,
    criteria_preparedness: score.criteria.preparedness,
    criteria_verbal_comm: score.criteria.verbalComm,
    criteria_visual_aids: score.criteria.visualAids,
    weighted_total: score.weightedTotal,
    is_no_show: score.isNoShow,
  };
}

// Convert database row to app Score type
function rowToScore(row: ScoreRow): Score {
  return {
    id: row.id,
    presenterId: row.presenter_id,
    judgeName: row.judge_name,
    judgeId: row.judge_id,
    timestamp: row.timestamp,
    criteria: {
      contentWhy: row.criteria_content_why,
      contentWhatHow: row.criteria_content_what_how,
      contentNextSteps: row.criteria_content_next_steps,
      presentationFlow: row.criteria_presentation_flow,
      preparedness: row.criteria_preparedness,
      verbalComm: row.criteria_verbal_comm,
      visualAids: row.criteria_visual_aids,
    },
    weightedTotal: row.weighted_total,
    isNoShow: row.is_no_show,
  };
}

// GET - Retrieve all scores
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Supabase error fetching scores:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const scores: Score[] = (data || []).map(rowToScore);
    return NextResponse.json({ scores });
  } catch (err) {
    console.error('Error fetching scores:', err);
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }
}

// POST - Save a new score (or update existing)
export async function POST(request: NextRequest) {
  try {
    const score: Score = await request.json();

    if (!score.id || !score.presenterId || !score.judgeName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const row = scoreToRow(score);

    // Upsert - insert or update if exists
    const { data, error } = await supabase
      .from('scores')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Supabase error saving score:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, score: rowToScore(data) });
  } catch (err) {
    console.error('Error saving score:', err);
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}
