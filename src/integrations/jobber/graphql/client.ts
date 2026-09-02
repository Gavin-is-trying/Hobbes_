import type { Config } from '../../../config/env.js';
import type { JobberOAuth } from '../auth/oauth.js';
import { JobberAuthenticationError, JobberGraphQLError, JobberNetworkError, JobberRateLimitError } from './errors.js';
export interface GraphQLResponse<T> { data?: T; errors?: Array<{ message: string; path?: Array<string|number>; extensions?: Record<string,unknown> }> }
export interface Connection<T> { nodes: T[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }
export class JobberGraphQLClient {
 constructor(private config: Pick<Config['jobber'],'graphqlEndpoint'|'apiVersion'>, private oauth: JobberOAuth, private fetchImpl: typeof fetch = fetch) {}
 async request<T>(query: string, variables: Record<string,unknown> = {}, attempt = 0): Promise<T> {
   const token = await this.oauth.getAccessToken(); const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 15_000);
   let response: Response;
   try { response = await this.fetchImpl(this.config.graphqlEndpoint, { method:'POST', signal: controller.signal, headers:{ authorization:`Bearer ${token}`, 'content-type':'application/json', accept:'application/json', 'X-JOBBER-GRAPHQL-VERSION':this.config.apiVersion }, body:JSON.stringify({query,variables}) }); }
   catch (error) { if (attempt < 2) { await delay(250 * 2 ** attempt); return this.request(query, variables, attempt + 1); } throw new JobberNetworkError('Jobber request failed.', { cause: error instanceof Error ? error.message : 'unknown' }); }
   finally { clearTimeout(timer); }
   if (response.status === 401) throw new JobberAuthenticationError('Jobber rejected the access token. Reconnect Jobber.');
   if (response.status === 429) { const retry = Math.min(Number(response.headers.get('retry-after') ?? 1) * 1000, 30_000); if (attempt < 2) { await delay(retry); return this.request(query,variables,attempt+1); } throw new JobberRateLimitError('Jobber rate limit exceeded.', retry); }
   if (response.status >= 500 && attempt < 2) { await delay(250 * 2 ** attempt); return this.request(query,variables,attempt+1); }
   if (!response.ok) throw new JobberNetworkError(`Jobber returned HTTP ${response.status}.`, { status: response.status });
   const body = await response.json() as GraphQLResponse<T>;
   if (body.errors?.length) throw new JobberGraphQLError(body.errors.map((e)=>e.message).join('; '), { errors: body.errors });
   if (!body.data) throw new JobberGraphQLError('Jobber returned no data.'); return body.data;
 }
 async paginate<T>(load: (cursor: string|null)=>Promise<Connection<T>>): Promise<T[]> { const result:T[]=[]; let cursor:string|null=null; do { const page=await load(cursor); result.push(...page.nodes); if (!page.pageInfo.hasNextPage) return result; if (!page.pageInfo.endCursor || page.pageInfo.endCursor===cursor) throw new JobberGraphQLError('Jobber pagination cursor did not advance.'); cursor=page.pageInfo.endCursor; } while(true); }
}
const delay=(ms:number)=>new Promise<void>((resolve)=>setTimeout(resolve,ms));
