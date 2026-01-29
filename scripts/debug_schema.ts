import { query } from '@/lib/db';

async function checkSchema() {
    try {
        console.log('Checking "recommendations" table schema...');
        const columns = await query('DESCRIBE recommendations');
        console.table(columns);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

checkSchema();
