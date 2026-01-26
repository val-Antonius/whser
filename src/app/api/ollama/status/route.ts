import { NextResponse } from 'next/server';
import { LLMService } from '@/services/LLMService';

export async function GET() {
    // Instantiate service (user ID 0 for system checks)
    const llmService = new LLMService({ userId: 0 });

    // Check status
    const status = await llmService.checkServiceStatus();

    return NextResponse.json({
        success: true,
        ...status,
        timestamp: new Date().toISOString()
    });
}
