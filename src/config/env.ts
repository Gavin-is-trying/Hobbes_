import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.string().min(1),
  JOBBER_CLIENT_ID: z.string().min(1), JOBBER_CLIENT_SECRET: z.string().min(1),
  JOBBER_REDIRECT_URI: z.string().url(), JOBBER_API_VERSION: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  JOBBER_GRAPHQL_ENDPOINT: z.string().url().default('https://api.getjobber.com/api/graphql'),
  JOBBER_AUTHORIZATION_ENDPOINT: z.string().url().default('https://api.getjobber.com/api/oauth/authorize'),
  JOBBER_TOKEN_ENDPOINT: z.string().url().default('https://api.getjobber.com/api/oauth/token'),
  OAUTH_STATE_SECRET: z.string().min(32),
  INTERNAL_API_KEY: z.string().min(24), WEBHOOK_WORKER_INTERVAL_MS: z.coerce.number().int().positive().default(5000)
});
export type Config = ReturnType<typeof loadConfig>;
export function loadConfig(environment: NodeJS.ProcessEnv = process.env) {
  const e = schema.parse(environment);
  return {
    nodeEnv: e.NODE_ENV, host: e.HOST, port: e.PORT, logLevel: e.LOG_LEVEL,
    databaseUrl: e.DATABASE_URL, internalApiKey: e.INTERNAL_API_KEY,
    workerIntervalMs: e.WEBHOOK_WORKER_INTERVAL_MS,
    jobber: { clientId: e.JOBBER_CLIENT_ID, clientSecret: e.JOBBER_CLIENT_SECRET,
      redirectUri: e.JOBBER_REDIRECT_URI, apiVersion: e.JOBBER_API_VERSION,
      graphqlEndpoint: e.JOBBER_GRAPHQL_ENDPOINT, authorizationEndpoint: e.JOBBER_AUTHORIZATION_ENDPOINT,
      tokenEndpoint: e.JOBBER_TOKEN_ENDPOINT, oauthStateSecret: e.OAUTH_STATE_SECRET }
  } as const;
}
