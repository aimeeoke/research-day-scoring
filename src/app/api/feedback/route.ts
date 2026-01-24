// API route for feedback - handles saving and retrieving feedback from Supabase

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Feedback } from '@/lib/types';

interface FeedbackRow {
  id: string;
  presenter_id: string;
  presenter_name: string;
  submitter_type: string;
  submitter_name: string;
  strengths: string | null;
  areas_for_improvement: string | null;
  timestamp: string;
}

// Convert app Feedback type to database row
function feedbackToRow(feedback: Feedback): FeedbackRow {
  return {
    id: feedback.id,
    presenter_id: feedback.presenterId,
    presenter_name: feedback.presenterName,
    submitter_type: feedback.submitterType,
    submitter_name: feedback.submitterName,
    strengths: feedback.strengths || null,
    areas_for_improvement: feedback.areasForImprovement || null,
    timestamp: feedback.timestamp,
  };
}

// Convert database row to app Feedback type
function rowToFeedback(row: FeedbackRow): Feedback {
  return {
    id: row.id,
    presenterId: row.presenter_id,
    presenterName: row.presenter_name,
    submitterType: row.submitter_type as 'judge' | 'attendee',
    submitterName: row.submitter_name,
    strengths: row.strengths || '',
    areasForImprovement: row.areas_for_improvement || '',
    timestamp: row.timestamp,
  };
}

// GET - Retrieve all feedback
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Supabase error fetching feedback:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const feedback: Feedback[] = (data || []).map(rowToFeedback);
    return NextResponse.json({ feedback });
  } catch (err) {
    console.error('Error fetching feedback:', err);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}

// POST - Save new feedback
export async function POST(request: NextRequest) {
  try {
    const feedback: Feedback = await request.json();

    if (!feedback.id || !feedback.presenterId || !feedback.submitterName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const row = feedbackToRow(feedback);

    const { data, error } = await supabase
      .from('feedback')
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error('Supabase error saving feedback:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, feedback: rowToFeedback(data) });
  } catch (err) {
    console.error('Error saving feedback:', err);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}
