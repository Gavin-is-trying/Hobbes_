import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPool } from './client.js';
import { loadConfig } from '../config/env.js';

export async function migrate(connectionString: string): Promise<void> {
  const pool = createPool(connectionString);
  const client = await pool.connect();
  try {
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    const directory = join(dirname(fileURLToPath(import.meta.url)), 'migrations');
    for (const name of (await readdir(directory)).filter((x) => x.endsWith('.sql')).sort()) {
      const exists = await client.query<{ name: string }>('SELECT name FROM schema_migrations WHERE name=$1', [name]);
      if (exists.rowCount) continue;
      await client.query('BEGIN');
      try {
        await client.query(await readFile(join(directory, name), 'utf8'));
        await client.query('INSERT INTO schema_migrations(name) VALUES($1) ON CONFLICT DO NOTHING', [name]);
        await client.query('COMMIT');
        console.info(JSON.stringify({ event: 'migration_applied', migration: name }));
      } catch (error) { await client.query('ROLLBACK'); throw error; }
    }
  } finally { client.release(); await pool.end(); }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) migrate(loadConfig().databaseUrl).catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
