
const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');

async function migrate() {
    console.log('Starting Phase 5 Migration...');

    // Parse DB credentials from .env or hardcoded for dev (WARNING: Hardcoded for this context based on previous files if available, else assume standard local dev defaults or try to read .env)
    // reading .env file manually since dotenv might not be installed
    let dbConfig = {
        host: 'localhost',
        user: 'root',
        password: '', // Default XAMPP/local password often empty
        database: 'laundry_management',
        multipleStatements: true
    };

    try {
        const envPath = path.resolve(__dirname, '../.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const lines = envContent.split('\n');
            lines.forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    const cleanValue = value.trim();
                    if (key.trim() === 'DB_HOST') dbConfig.host = cleanValue;
                    if (key.trim() === 'DB_USER') dbConfig.user = cleanValue;
                    if (key.trim() === 'DB_PASSWORD') dbConfig.password = cleanValue;
                    if (key.trim() === 'DB_NAME') dbConfig.database = cleanValue;
                }
            });
        }
    } catch (e) {
        console.warn('Could not read .env, using defaults');
    }

    const connection = await mysql.createConnection(dbConfig);

    try {
        const sqlPath = path.resolve(__dirname, '../database/migration_phase5.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing SQL...');
        await connection.query(sql);
        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
