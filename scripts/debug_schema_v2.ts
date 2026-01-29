import { query } from '@/lib/db';

async function checkColumn() {
    try {
        console.log('Checking "insight_id" column in "recommendations"...');
        const list: any = await query("SHOW COLUMNS FROM recommendations LIKE 'insight_id'");
        console.log(JSON.stringify(list, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

checkColumn();
