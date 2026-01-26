import { NextResponse } from 'next/server';
import { generateCompletion, parseJSONResponse } from '@/lib/ollama';
import { buildInsightPrompt, MetricData } from '@/lib/prompts';

export async function GET() {
    try {
        // 1. Mock Data
        const mockMetrics: MetricData[] = [
            {
                name: 'SLA Compliance',
                currentValue: 87,
                baselineValue: 95,
                variance: -8,
                variancePercentage: -8.42,
                unit: '%',
                goal: 'higher-is-better'
            },
            {
                name: 'Rewash Rate',
                currentValue: 4.8,
                baselineValue: 2.5,
                variance: 2.3,
                variancePercentage: 92.0,
                unit: '%',
                goal: 'lower-is-better'
            },
            {
                name: 'Productivity',
                currentValue: 15,
                baselineValue: 18,
                variance: -3,
                variancePercentage: -16.6,
                unit: ' orders/day',
                goal: 'higher-is-better'
            },
            {
                name: 'Inventory Variance',
                currentValue: 2,
                baselineValue: 8,
                variance: -6,
                variancePercentage: -75.0,
                unit: '%',
                goal: 'lower-is-better'
            }
        ];

        const period = 'Week 4, Jan 2026';

        // 2. Build Prompt
        const prompt = buildInsightPrompt({ period, metrics: mockMetrics });

        // 3. Generate with Ollama
        const start = Date.now();
        const result = await generateCompletion(prompt, {
            model: 'gemma3:4b',
            temperature: 0.1, // Reduced temp for consistency
            format: 'json'
        });
        const duration = Date.now() - start;

        // 4. Parse Response
        const parsedData = parseJSONResponse(result.response);

        // Production-ready response: No raw prompt/response unless specifically requested (omitted here for safety)
        return NextResponse.json({
            success: true,
            duration_ms: duration,
            data: parsedData
        });

    } catch (error: any) {
        // Structured error handling
        const status = error.name === 'OllamaConnectionError' ? 503 :
            error.name === 'OllamaParserError' ? 422 : 500;

        return NextResponse.json({
            success: false,
            error: error.name,
            message: error.message
        }, { status });
    }
}

