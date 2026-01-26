import { formatCurrency } from './utils';
// Type definitions for Prompt Construction
export interface MetricData {
  name: string;
  currentValue: number | string;
  baselineValue: number | string;
  variance: number;
  variancePercentage: number;
  unit?: string;
  goal: 'higher-is-better' | 'lower-is-better';
}

export interface InsightPromptOptions {
  period: string;
  metrics: MetricData[];
}

/**
 * Formats a single metric line for the prompt
 */
function formatMetricLine(m: MetricData): string {
  const unit = m.unit || '';
  const sign = m.variance >= 0 ? '+' : '';
  const trendContext = m.goal === 'higher-is-better'
    ? '(Higher is Better)'
    : '(Lower is Better)';

  return `- ${m.name}: ${m.currentValue}${unit} (Baseline: ${m.baselineValue}${unit}, Variance: ${sign}${m.variancePercentage.toFixed(2)}%) ${trendContext}`;
}

/**
 * Builds the complete system prompt for insight generation
 */
export function buildInsightPrompt(options: InsightPromptOptions): string {
  const metricLines = options.metrics.map(formatMetricLine).join('\n');

  return `
You are analyzing laundry business operational data for a single location.
Your goal is to identify operational issues, efficiency gaps, or positive trends based on the provided metrics.

Period: ${options.period}

Metrics:
${metricLines}

INSTRUCTIONS:
1. Compare current values against baselines.
2. Focus on significant deviations (variance > 5% or < -5%).
3. Consider the operational context of a laundry business.
4. Generate insights that are specific and actionable.
5. Assign a severity level:
   - "normal": Variance within accepted range / positive trend.
   - "attention": Variance > 5% but manageable / needs monitoring.
   - "critical": Variance > 10% / severe operational impact / requires immediate action.

OUTPUT FORMAT:
Return strictly valid JSON with no markdown formatting.
Structure:
{
  "insights": [
    {
      "statement": "Concise statement describing the finding and its potential impact.",
      "severity": "normal" | "attention" | "critical",
      "metrics_involved": ["Exact Name of Metric 1", "Exact Name of Metric 2"]
    }
  ]
}

Make sure to strictly follow the JSON format. Do not include any explanation outside the JSON.
`;
}

export interface RecommendationPromptOptions {
  insightStatement: string;
}

/**
 * Builds the system prompt for recommendation generation
 */
export function buildRecommendationPrompt(options: RecommendationPromptOptions): string {
  return `
You are an expert laundry business consultant.
Based on the following insight derived from operational data:

"${options.insightStatement}"

Generate actionable recommendations in JSON format.

INSTRUCTIONS:
1. Recommendations must be executable by humans (Owner or Admin).
2. Do NOT suggest automated system changes (e.g., "update the code", "change database").
3. Focus on process improvements, staffing adjustments, capacity planning, or pricing strategies.
4. Assign an urgency level based on the severity of the insight implied.

OUTPUT FORMAT:
Return strictly valid JSON with no markdown formatting.
Structure:
{
  "recommendations": [
    {
      "action": "Specific, clear action to take. Start with a verb.",
      "category": "SOP" | "staffing" | "capacity" | "pricing",
      "urgency": "low" | "medium" | "high",
      "rationale": "Brief explanation of why this recommendation will solve the issue."
    }
  ]
}

Make sure to strictly follow the JSON format. Do not include any explanation outside the JSON.
`;
}
