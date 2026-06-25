import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createClient } from '../../../lib/supabase';

interface ConceptRow {
  subject: string;
  concept: string;
  mastery_level: 'Introduced' | 'Developing' | 'Proficient' | 'Strong';
  weak_areas?: string[];
  strong_areas?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { userMessage, subject, concept } = await req.json();

    if (!userMessage) {
      return NextResponse.json(
        { error: 'userMessage is required' },
        { status: 400 }
      );
    }

    let systemPrompt = '';
    let conceptData: ConceptRow | null = null;

    // Query Supabase if subject and concept are provided
    if (subject && concept) {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('concepts')
        .select('*')
        .eq('subject', subject)
        .eq('concept', concept)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Supabase query failed — skipping concept lookup');
      } else if (data) {
        conceptData = data;
      }
    }

    // Build system prompt based on mastery level
    if (conceptData) {
      const { mastery_level, weak_areas, strong_areas } = conceptData;

      if (mastery_level === 'Introduced' || mastery_level === 'Developing') {
        // Mode B: Reference prior knowledge, mention weak areas, moderate pace
        const weakAreasText = weak_areas?.length
          ? `Weak areas to be aware of: ${weak_areas.join(', ')}`
          : '';
        const strongAreasText = strong_areas?.length
          ? `Strong areas to build upon: ${strong_areas.join(', ')}`
          : '';

        systemPrompt = `You are a knowledgeable and supportive tutor helping a student understand concepts.

Context:
- Topic: "${concept}" in "${subject}"
- Mastery Level: ${mastery_level}
${weakAreasText ? `- ${weakAreasText}` : ''}
${strongAreasText ? `- ${strongAreasText}` : ''}

Instructions:
- Reference their prior knowledge and strong areas
- Gently address weak areas and provide extra support
- Maintain a moderate, encouraging pace
- Help build understanding progressively`;
      } else if (mastery_level === 'Proficient' || mastery_level === 'Strong') {
        // Mode C: Technical, skip basics, focus on nuance
        const weakAreasText = weak_areas?.length
          ? `Specific weak areas to revisit: ${weak_areas.join(', ')}`
          : '';
        const strongAreasText = strong_areas?.length
          ? `Demonstrated strengths: ${strong_areas.join(', ')}`
          : '';

        systemPrompt = `You are an expert tutor for advanced learners.

Context:
- Topic: "${concept}" in "${subject}"
- Mastery Level: ${mastery_level}
${weakAreasText ? `- ${weakAreasText}` : ''}
${strongAreasText ? `- ${strongAreasText}` : ''}

Instructions:
- Use technical and precise language
- Skip foundational concepts and basics
- Focus on nuances, advanced applications, and edge cases
- Challenge with deeper insights and theoretical connections
- Where weak areas exist, provide targeted advanced reinforcement`;
      }
    } else {
      // Mode A: No matching concept found - beginner friendly
      systemPrompt = `You are a friendly and encouraging tutor for beginners learning new concepts.

Instructions:
- Explain using clear analogies and real-world examples
- Define all technical terms in simple language
- Break down complex ideas into smaller, digestible pieces
- Use a warm, supportive tone
- Check for understanding as you go`;
    }

    // Stream response from Anthropic API
    const result = streamText({
      model: anthropic('claude-sonnet-4-5'),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // Return streamed text response
    return result.toTextStreamResponse({
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
