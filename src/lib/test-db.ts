import { testConnection } from './db';

async function main() {
    console.log('Testing database connection...');
    const success = await testConnection();

    if (success) {
        console.log('✅ Database connection successful!');
        process.exit(0);
    } else {
        console.log('❌ Database connection failed!');
        process.exit(1);
    }
}

main();