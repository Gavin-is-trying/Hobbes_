import type { Queryable } from '../../../database/client.js';
export interface StoredConnection { accountId: string; accessToken: string; refreshToken: string; accessTokenExpiresAt: Date; scopes: string | null }
export class TokenStore {
  constructor(private readonly db: Queryable) {}
  async get(accountId = 'default'): Promise<StoredConnection | null> {
    const { rows } = await this.db.query(`SELECT account_id, access_token, refresh_token, access_token_expires_at, scopes FROM jobber_connections WHERE account_id=$1`, [accountId]);
    const row = rows[0]; if (!row) return null;
    return { accountId: row.account_id, accessToken: row.access_token, refreshToken: row.refresh_token, accessTokenExpiresAt: row.access_token_expires_at, scopes: row.scopes };
  }
  async save(token: { accountId?: string; accessToken: string; refreshToken: string; expiresIn: number; scopes?: string | null }): Promise<void> {
    await this.db.query(`INSERT INTO jobber_connections(account_id,access_token,refresh_token,access_token_expires_at,scopes)
      VALUES($1,$2,$3,now()+($4*interval '1 second'),$5) ON CONFLICT(account_id) DO UPDATE SET access_token=excluded.access_token,
      refresh_token=excluded.refresh_token, access_token_expires_at=excluded.access_token_expires_at, scopes=excluded.scopes, updated_at=now()`,
      [token.accountId ?? 'default', token.accessToken, token.refreshToken, token.expiresIn, token.scopes ?? null]);
  }
  async delete(accountId = 'default'): Promise<void> { await this.db.query('DELETE FROM jobber_connections WHERE account_id=$1', [accountId]); }
}
