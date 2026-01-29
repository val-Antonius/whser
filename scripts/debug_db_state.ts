import { query } from '@/lib/db';

async function debugDbState() {
    console.log('🔍 Debugging DB State for Snapshot 1...');

    try {
        // List all snapshots with their insight counts
        const snapshots = await query<any>(`
            SELECT ds.id, ds.snapshot_name, ds.period_start, COUNT(i.id) as insight_count 
            FROM data_snapshots ds 
            LEFT JOIN insights i ON ds.id = i.snapshot_id 
            GROUP BY ds.id
        `);

        console.table(snapshots);

    } catch (e) {
        console.error('Debug failed:', e);
    }
    process.exit(0);
}

debugDbState();
