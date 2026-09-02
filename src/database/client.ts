import pg from 'pg';
export type Queryable = Pick<pg.Pool, 'query'>;
export function createPool(connectionString: string): pg.Pool {
  return new pg.Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000 });
}
