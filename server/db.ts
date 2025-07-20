import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for WebSocket support
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Enhanced pool configuration for production
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  // Production pool settings
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Wait up to 10 seconds for a connection
};

let pool: Pool;
let db: ReturnType<typeof drizzle>;

try {
  console.log('🔗 Initializing database connection pool...');
  pool = new Pool(poolConfig);
  db = drizzle({ client: pool, schema });
  
  // Test the connection on startup
  pool.on('connect', () => {
    console.log('✅ Database connection established');
  });
  
  pool.on('error', (err) => {
    console.error('❌ Database pool error:', err);
  });
  
  console.log('✅ Database client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize database:', error);
  throw error;
}

export { pool, db };