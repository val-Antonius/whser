// ============================================================================
// DATABASE CONNECTION CONFIGURATION
// ============================================================================
// Purpose: MySQL connection pool and query utilities
// ============================================================================

import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'laundry_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

// Create connection pool
let pool: mysql.Pool | null = null;

/**
 * Get or create database connection pool
 */
export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

/**
 * Execute a SQL query with parameters
 * @param sql SQL query string
 * @param params Query parameters (optional)
 * @returns Query results
 */
export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  try {
    const connection = getPool();
    // Use query() instead of execute() for better MySQL compatibility
    // execute() has issues with certain MySQL versions and data types
    let results;
    if (params && params.length > 0) {
      [results] = await connection.query(sql, params);
    } else {
      [results] = await connection.query(sql);
    }
    return results as T[];
  } catch (error) {
    console.error('Database query error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Execute a SQL query and return a single row
 * @param sql SQL query string
 * @param params Query parameters (optional)
 * @returns Single row or null
 */
export async function queryOne<T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const results = await query<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Execute a transaction with multiple queries
 * @param callback Transaction callback function
 * @returns Transaction result
 */
export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    console.error('Transaction error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Test database connection
 * @returns true if connection successful, false otherwise
 */
export async function testConnection(): Promise<boolean> {
  try {
    const connection = getPool();
    await connection.query('SELECT 1');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

/**
 * Close database connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connection pool closed');
  }
}

/**
 * Get insert ID from result
 */
export function getInsertId(result: any): number {
  return result.insertId;
}

/**
 * Get affected rows from result
 */
export function getAffectedRows(result: any): number {
  return result.affectedRows;
}

// Default export for backward compatibility
export default getPool();
