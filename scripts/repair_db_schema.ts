import { query } from '@/lib/db';

async function migrate() {
    console.log('Running Migration: Fix Nullable Columns...');
    try {
        // 1. Make insight_id nullable in recommendations
        await query("ALTER TABLE recommendations MODIFY insight_id INT NULL");
        console.log('✅ recommendations.insight_id is now NULLABLE');

        // 2. Make insight_id nullable in tasks (safety check)
        await query("ALTER TABLE tasks MODIFY insight_id INT NULL");
        console.log('✅ tasks.insight_id is now NULLABLE');

        // 3. Make recommendation_id nullable in tasks
        await query("ALTER TABLE tasks MODIFY recommendation_id INT NULL");
        console.log('✅ tasks.recommendation_id is now NULLABLE');

    } catch (e) {
        console.error('Migration Failed:', e);
    }
    process.exit(0);
}

migrate();
