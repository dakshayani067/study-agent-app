import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

interface ExtractionResult {
  subject: string;
  concept: string;
}

export async function POST(req: NextRequest) {
  try {
    const { userMessage } = await req.json();

    if (!userMessage) {
      return NextResponse.json(
        { error: 'userMessage is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert at extracting educational concepts from user messages.

Your task:
1. Analyze the user's message to determine if they are asking about studying a specific concept
2. Extract the subject (e.g., "Biology", "Mathematics", "History") and concept (e.g., "Photosynthesis", "Calculus", "French Revolution")
3. Return ONLY a valid JSON object with exactly these fields:
   - "subject": the academic subject (string, empty string if not about studying)
   - "concept": the specific concept being studied (string, empty string if not about studying)

If the message is not about studying a concept, return:
{"subject": "", "concept": ""}

Important: Return ONLY valid JSON, nothing else.`;

    const { text } = await generateText({
      model: anthropic('claude-sonnet-4-5'),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // Parse the response as JSON
    const extractedData = JSON.parse(text) as ExtractionResult;

    return NextResponse.json(extractedData);
  } catch (error) {
    console.error('Detect concept API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
