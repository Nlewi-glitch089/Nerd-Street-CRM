import { Pool } from 'pg';

// Use a single global pool during development to avoid exhausting connections
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // still allow the file to be imported without crashing; queries will throw when used
  console.warn('Warning: DATABASE_URL is not defined. Set it in .env.local');
}

let pool;

if (!global.__pgPool) {
  pool = new Pool({
    connectionString,
    // Neon requires SSL; in production we enable it explicitly
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  global.__pgPool = pool;
} else {
  pool = global.__pgPool;
}

export async function query(text, params) {
  if (!connectionString) throw new Error('DATABASE_URL is not set in environment');
  return pool.query(text, params);
}
