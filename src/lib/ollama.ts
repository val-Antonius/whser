// Utility import removed as sleep uses inline Promise


// Configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL = 'gemma3:4b';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export interface OllamaGenerationOptions {
    model?: string;
    temperature?: number;
    system?: string;
    stream?: boolean;
    format?: 'json';
    options?: Record<string, any>;
}

export interface OllamaResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    context?: number[];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}

export class OllamaError extends Error {
    constructor(public message: string, public status?: number, public code?: string) {
        super(message);
        this.name = 'OllamaError';
    }
}

export class OllamaConnectionError extends OllamaError {
    constructor(message: string = 'Could not connect to Ollama server') {
        super(message, 503, 'CONNECTION_REFUSED');
        this.name = 'OllamaConnectionError';
    }
}

export class OllamaParserError extends OllamaError {
    constructor(message: string, public rawResponse: string) {
        super(message, 422, 'INVALID_JSON');
        this.name = 'OllamaParserError';
    }
}

/**
 * Checks if the Ollama server is reachable
 */
export async function checkConnection(): Promise<boolean> {
    try {
        const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
        return res.ok;
    } catch (error) {
        console.warn('Ollama connection check failed:', error);
        return false;
    }
}

/**
 * Generates valid JSON from Ollama, handling potential markdown code blocks
 */
export function parseJSONResponse<T>(response: string): T {
    try {
        // Remove markdown code blocks if present
        const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleaned) as T;
    } catch (error) {
        // Don't log full response here to avoid leaking sensitive data in logs, 
        // let the caller handle the error with the attached rawResponse if needed for debug
        throw new OllamaParserError('Invalid JSON response from LLM', response);
    }
}

/**
 * Generates a completion from Ollama with retry logic
 */
export async function generateCompletion(
    prompt: string,
    options: OllamaGenerationOptions = {}
): Promise<OllamaResponse> {
    const model = options.model || DEFAULT_MODEL;
    const endpoint = `${OLLAMA_BASE_URL}/api/generate`;

    const payload = {
        model,
        prompt,
        stream: false,
        system: options.system,
        format: options.format,
        options: {
            temperature: options.temperature || 0.7,
            ...options.options
        }
    };

    let lastError: any;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                let errorMsg = `Ollama API error: ${response.statusText}`;
                try {
                    const errorBody = await response.text();
                    errorMsg += ` - ${errorBody}`;
                } catch { }
                throw new OllamaError(errorMsg, response.status);
            }

            const data = await response.json() as OllamaResponse;
            return data;

        } catch (error: any) {
            lastError = error;
            console.warn(`Ollama attempt ${attempt} failed: ${error.message}`);

            if (attempt < MAX_RETRIES) {
                // Exponential backoff
                const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw new OllamaError(`Failed to generate completion after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}
