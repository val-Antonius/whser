import { NextResponse } from 'next/server';
import { validateLLMResponse, InsightResponseSchema, RecommendationResponseSchema } from '@/lib/validation';

export async function GET() {
    const results = {
        validInsight: null as any,
        invalidInsight: null as any,
        validRecommendation: null as any,
        invalidRecommendation: null as any
    };

    // 1. Valid Insight
    const validInsightJson = {
        insights: [
            {
                statement: "SLA compliance dropped below 90% due to staff shortage.",
                severity: "critical",
                metrics_involved: ["SLA Compliance", "Productivity"]
            }
        ]
    };
    results.validInsight = validateLLMResponse(InsightResponseSchema, validInsightJson);

    // 2. Invalid Insight (Missing Metrics)
    const invalidInsightJson = {
        insights: [
            {
                statement: "Something is wrong.",
                severity: "normal",
                metrics_involved: [] // Empty array violates constraint
            }
        ]
    };
    results.invalidInsight = validateLLMResponse(InsightResponseSchema, invalidInsightJson);

    // 3. Valid Recommendation
    const validRecJson = {
        recommendations: [
            {
                action: "Hire 2 part-time staff for weekends.",
                category: "staffing",
                urgency: "high",
                rationale: "To address the SLA drop on Saturdays."
            }
        ]
    };
    results.validRecommendation = validateLLMResponse(RecommendationResponseSchema, validRecJson);

    // 4. Invalid Recommendation (Invalid Category)
    const invalidRecJson = {
        recommendations: [
            {
                action: "Update the database schema.",
                category: "technical", // Invalid category
                urgency: "low"
            }
        ]
    };
    results.invalidRecommendation = validateLLMResponse(RecommendationResponseSchema, invalidRecJson);

    return NextResponse.json({
        success: true,
        results
    });
}
