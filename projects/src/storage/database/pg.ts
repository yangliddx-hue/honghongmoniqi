import dotenv from 'dotenv';
import { Pool, type QueryResultRow } from 'pg';

let envLoaded = false;
let pool: Pool | null = null;

function loadEnv(): void {
  if (envLoaded) {
    return;
  }

  dotenv.config({ path: ['.env.local', '.env'], quiet: true });
  envLoaded = true;
}

function getDatabaseUrl(): string {
  loadEnv();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  return databaseUrl;
}

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  return pool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
) {
  return getPool().query<T>(text, params);
}