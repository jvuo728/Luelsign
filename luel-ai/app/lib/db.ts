import { Pool } from 'pg';

// Create a connection pool lazily - only check DATABASE_URL when actually needed
// This allows the module to be imported during build time without requiring the env var
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Connection pool settings
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test the connection
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  
  return pool;
}

export { getPool };
