import { generateCompletion, parseJSONResponse, OllamaConnectionError, checkConnection } from '@/lib/ollama';
import { InsightResponseSchema, RecommendationResponseSchema, validateLLMResponse, ValidatedInsight } from '@/lib/validation';
import { buildInsightPrompt, buildRecommendationPrompt, MetricData } from '@/lib/prompts';
import { InsightSchema, RecommendationSchema } from '@/lib/validation';

export interface LLMServiceOptions {
    userId: number; // For tracking who triggered/overrode
}

export class LLMService {
    constructor(private options: LLMServiceOptions) { }

    /**
     * Checks if the LLM service is online
     */
    async checkServiceStatus(): Promise<{ online: boolean; model?: string }> {
        const isConnected = await checkConnection();
        return { online: isConnected, model: 'gemma3:4b' };
    }

    /**
     * Helper: Generates rule-based insights when LLM fails
     */
    private generateRuleBasedInsights(metrics: MetricData[]): ValidatedInsight[] {
        const insights: ValidatedInsight[] = [];

        metrics.forEach(m => {
            // Logic: Variance > 5% = Attention, > 10% = Critical
            const varianceAbs = Math.abs(m.variancePercentage);
            let severity: 'normal' | 'attention' | 'critical' = 'normal';

            if (varianceAbs > 10) severity = 'critical';
            else if (varianceAbs > 5) severity = 'attention';

            if (severity !== 'normal') {
                const direction = m.variancePercentage > 0 ? 'increased' : 'decreased';
                const trend = m.goal === 'higher-is-better'
                    ? (m.variancePercentage > 0 ? 'Positive' : 'Negative')
                    : (m.variancePercentage < 0 ? 'Positive' : 'Negative');

                // Only report negative trends or critical deviations
                if (trend === 'Negative' || severity === 'critical') {
                    insights.push({
                        statement: `${m.name} ${direction} by ${varianceAbs.toFixed(1)}% (Baseline: ${m.baselineValue}${m.unit}). This requires ${severity} level review.`,
                        severity: severity,
                        metrics_involved: [m.name]
                    });
                }
            }
        });

        // Ensure at least one insight
        if (insights.length === 0) {
            insights.push({
                statement: "All metrics are performing within normal baseline ranges.",
                severity: "normal",
                metrics_involved: []
            });
        }

        return insights;
    }

    /**
     * Generates insights from metrics with validation and fallback
     */
    async generateInsights(period: string, metrics: MetricData[], snapshotId: number) {
        try {
            const prompt = buildInsightPrompt({ period, metrics });
            const response = await generateCompletion(prompt, { format: 'json', temperature: 0.2 });

            const parsed = parseJSONResponse(response.response);
            const validation = validateLLMResponse(InsightResponseSchema, parsed);

            if (!validation.success) {
                console.warn('LLM Insight Validation Failed:', validation.error);
                // Fallback: Rule-Based
                const fallbackInsights = this.generateRuleBasedInsights(metrics);
                return { success: true, data: fallbackInsights, source: 'rule-based', error: 'LLM Validation Failed' };
            }

            // In a real implementation, we would save to DB here with 'generated_by' = 'llm'
            // For now, returning the validated structure
            return { success: true, data: validation.data.insights, source: 'llm' };

        } catch (error) {
            console.error('LLM Insight Generation Failed:', error);
            // Fallback: Rule-Based
            const fallbackInsights = this.generateRuleBasedInsights(metrics);
            const errorType = error instanceof OllamaConnectionError ? 'LLM Unavailable' : 'Generation Error';

            return { success: true, data: fallbackInsights, source: 'rule-based', error: errorType };
        }
    }

    /**
     * Generates recommendations from an insight with validation
     */
    async generateRecommendations(insightStatement: string, insightId: number) {
        try {
            const prompt = buildRecommendationPrompt({ insightStatement });
            const response = await generateCompletion(prompt, { format: 'json', temperature: 0.2 });

            const parsed = parseJSONResponse(response.response);
            const validation = validateLLMResponse(RecommendationResponseSchema, parsed);

            if (!validation.success) {
                console.warn('LLM Recommendation Validation Failed:', validation.error);
                return { success: false, error: 'Validation Error', details: validation.error };
            }

            return { success: true, data: validation.data.recommendations, source: 'llm' };

        } catch (error) {
            console.error('LLM Recommendation Generation Failed:', error);
            return { success: false, error: 'Generation Failed' };
        }
    }

    /**
     * Manual Override: Allows manual creation/correction of LLM data
     */
    async saveManualInsight(data: any, snapshotId: number) {
        // Validate manual input as well to ensure DB integrity
        const validation = validateLLMResponse(InsightSchema, data);
        if (!validation.success) {
            throw new Error(`Invalid manual input: ${validation.error}`);
        }

        // Return structured data ready for DB insert with source='manual'
        return {
            ...validation.data,
            snapshot_id: snapshotId,
            generated_by: 'manual',
            created_by: this.options.userId
        };
    }
}
