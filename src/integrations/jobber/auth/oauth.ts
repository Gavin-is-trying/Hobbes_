import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Config } from '../../../config/env.js';
import { JobberAuthenticationError } from '../graphql/errors.js';
import { TokenStore } from './token-store.js';
interface TokenResponse { access_token: string; refresh_token: string; expires_in: number; scope?: string }
export class JobberOAuth {
  private refreshInFlight: Promise<string> | undefined;
  constructor(private readonly config: Config['jobber'], private readonly store: TokenStore, private readonly fetchImpl: typeof fetch = fetch) {}
  createAuthorizationUrl(): string {
    const nonce = randomBytes(24).toString('base64url');
    const signature = createHmac('sha256', this.config.oauthStateSecret).update(nonce).digest('base64url');
    const url = new URL(this.config.authorizationEndpoint);
    url.search = new URLSearchParams({ client_id: this.config.clientId, redirect_uri: this.config.redirectUri, response_type: 'code', state: `${nonce}.${signature}` }).toString();
    return url.toString();
  }
  verifyState(state: string): boolean {
    const [nonce, supplied] = state.split('.'); if (!nonce || !supplied) return false;
    const expected = createHmac('sha256', this.config.oauthStateSecret).update(nonce).digest();
    let actual: Buffer; try { actual = Buffer.from(supplied, 'base64url'); } catch { return false; }
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
  async exchangeCode(code: string): Promise<void> { await this.requestToken({ grant_type: 'authorization_code', code, redirect_uri: this.config.redirectUri }); }
  async getAccessToken(): Promise<string> {
    const connection = await this.store.get();
    if (!connection) throw new JobberAuthenticationError('Jobber is not connected. Visit /auth/jobber.');
    if (connection.accessTokenExpiresAt.getTime() > Date.now() + 60_000) return connection.accessToken;
    this.refreshInFlight ??= this.refresh(connection.refreshToken).finally(() => { this.refreshInFlight = undefined; });
    return this.refreshInFlight;
  }
  async invalidate(): Promise<void> { await this.store.delete(); }
  private async refresh(refreshToken: string): Promise<string> {
    try { const token = await this.requestToken({ grant_type: 'refresh_token', refresh_token: refreshToken }); return token.access_token; }
    catch (error) { await this.store.delete(); throw new JobberAuthenticationError('Jobber authorization expired. Reconnect at /auth/jobber.', { cause: error instanceof Error ? error.message : 'unknown' }); }
  }
  private async requestToken(values: Record<string,string>): Promise<TokenResponse> {
    const response = await this.fetchImpl(this.config.tokenEndpoint, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
      body: new URLSearchParams({ ...values, client_id: this.config.clientId, client_secret: this.config.clientSecret }) });
    if (!response.ok) throw new JobberAuthenticationError(`Jobber token request failed (${response.status}).`);
    const token = await response.json() as Partial<TokenResponse>;
    if (!token.access_token || !token.refresh_token || !token.expires_in) throw new JobberAuthenticationError('Jobber returned an invalid token response.');
    await this.store.save({ accessToken: token.access_token, refreshToken: token.refresh_token, expiresIn: token.expires_in, scopes: token.scope ?? null });
    return token as TokenResponse;
  }
}
