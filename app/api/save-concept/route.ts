import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase';

interface SaveConceptRequest {
  subject: string;
  concept: string;
  masteryLevel: 'Introduced' | 'Developing' | 'Proficient' | 'Strong';
  overviewGist: string;
  deepDiveGist: string[];
  strongAreas: string[];
  weakAreas: string[];
  nextSteps: string[];
  notes?: string;
}

export async function POST(req: NextRequest) {
  try {
    const {
      subject,
      concept,
      masteryLevel,
      overviewGist,
      deepDiveGist,
      strongAreas,
      weakAreas,
      nextSteps,
      notes,
    } = (await req.json()) as SaveConceptRequest;

    // Validate required fields
    if (!subject || !concept || !masteryLevel) {
      return NextResponse.json(
        { error: 'subject, concept, and masteryLevel are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Upsert the concept into the database
    const { data, error } = await supabase
      .from('concepts')
      .upsert(
        {
          subject,
          concept,
          mastery_level: masteryLevel,
          overview_gist: overviewGist,
          deep_dive_gist: deepDiveGist,
          strong_areas: strongAreas,
          weak_areas: weakAreas,
          next_steps: nextSteps,
          notes: notes || null,
          last_updated: new Date().toISOString(),
        },
        {
          onConflict: 'subject,concept',
        }
      )
      .select();

    if (error) {
      console.warn('Supabase upsert failed — check SUPABASE keys and data');
      return NextResponse.json(
        { error: 'Failed to save concept' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Concept saved successfully',
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Save concept API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
