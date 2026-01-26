import { NextResponse } from 'next/server';
import { generateCompletion, parseJSONResponse } from '@/lib/ollama';
import { buildRecommendationPrompt } from '@/lib/prompts';

export async function GET() {
    try {
        // 1. Mock Data (Insight)
        const mockInsight = {
            statement: "Rewash rate increased to 4.8%, significantly above the 2.5% baseline. This trend is causing delays in order completion.",
            severity: "attention"
        };

        // 2. Build Prompt
        const prompt = buildRecommendationPrompt({
            insightStatement: mockInsight.statement
        });

        // 3. Generate with Ollama
        const start = Date.now();
        const result = await generateCompletion(prompt, {
            model: 'gemma3:4b',
            temperature: 0.2,
            format: 'json'
        });
        const duration = Date.now() - start;

        // 4. Parse Response
        const parsedData = parseJSONResponse(result.response);

        return NextResponse.json({
            success: true,
            duration_ms: duration,
            insight: mockInsight,
            data: parsedData
        });

    } catch (error: any) {
        const status = error.name === 'OllamaConnectionError' ? 503 :
            error.name === 'OllamaParserError' ? 422 : 500;

        return NextResponse.json({
            success: false,
            error: error.name,
            message: error.message
        }, { status });
    }
}
