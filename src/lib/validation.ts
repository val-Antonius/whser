import { z } from 'zod';

// --- Insight Validation ---

export const InsightSchema = z.object({
    statement: z.string().min(10, "Statement must be at least 10 characters").max(500, "Statement is too long"),
    severity: z.enum(['normal', 'attention', 'critical']),
    metrics_involved: z.array(z.string()).min(1, "At least one metric must be involved")
});

export const InsightResponseSchema = z.object({
    insights: z.array(InsightSchema).min(1, "At least one insight is required")
});

export type ValidatedInsight = z.infer<typeof InsightSchema>;
export type ValidatedInsightResponse = z.infer<typeof InsightResponseSchema>;


// --- Recommendation Validation ---

export const RecommendationSchema = z.object({
    action: z.string().min(5, "Action must be clear and at least 5 characters"),
    category: z.enum(['SOP', 'staffing', 'capacity', 'pricing']),
    urgency: z.enum(['low', 'medium', 'high']),
    rationale: z.string().min(10, "Rationale is too short").optional()
});

export const RecommendationResponseSchema = z.object({
    recommendations: z.array(RecommendationSchema).min(1, "At least one recommendation is required")
});

export type ValidatedRecommendation = z.infer<typeof RecommendationSchema>;
export type ValidatedRecommendationResponse = z.infer<typeof RecommendationResponseSchema>;


// --- Validation Helper ---

export function validateLLMResponse<T>(schema: z.ZodSchema<T>, data: any): { success: true; data: T } | { success: false; error: string } {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    } else {
        // Format Zod error to be readable
        const errorMessage = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return { success: false, error: errorMessage };
    }
}
