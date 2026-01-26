import { NextResponse } from 'next/server';
import { checkConnection, generateCompletion } from '@/lib/ollama';

export async function GET() {
    try {
        // 1. Check Connection
        const isConnected = await checkConnection();

        if (!isConnected) {
            return NextResponse.json({
                success: false,
                message: 'Ollama server is not reachable. Is it running on port 11434?'
            }, { status: 503 });
        }

        // 2. Test Generation
        const prompt = 'Explain what a laundry management system is in one short sentence.';
        const result = await generateCompletion(prompt, {
            temperature: 0.1,
            model: 'gemma3:4b' // Explicitly use the model requested
        });

        return NextResponse.json({
            success: true,
            connection: true,
            model: result.model,
            response: result.response,
            duration: result.total_duration
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: error.message,
            details: error.stack
        }, { status: 500 });
    }
}
