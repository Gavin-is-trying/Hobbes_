import Fastify from 'fastify';
import rawBody from '@fastify/raw-body';
import type pg from 'pg';
import type { Config } from './config/env.js';
import { BusinessService } from './services/business-service.js';
import type { JobberOAuth } from './integrations/jobber/auth/oauth.js';
import { verifyJobberWebhook } from './integrations/jobber/webhooks/verification.js';
import type { WebhookEventStore } from './integrations/jobber/webhooks/event-store.js';
import type { JobberSyncService } from './integrations/jobber/sync/sync-service.js';
declare module 'fastify' { interface FastifyRequest { rawBody?: Buffer } }
export async function buildApp(deps:{config:Config;pool:pg.Pool;oauth:JobberOAuth;events:WebhookEventStore;sync:JobberSyncService}){
 const app=Fastify({logger:{level:deps.config.logLevel,redact:['req.headers.authorization','req.headers.x-internal-api-key']}});await app.register(rawBody,{field:'rawBody',global:true,encoding:false,runFirst:true});const business=new BusinessService(deps.pool);
 app.get('/health',async(_req,reply)=>{try{await deps.pool.query('SELECT 1');return{status:'ok',database:'reachable'}}catch{return reply.code(503).send({status:'degraded',database:'unreachable'})}});
 app.get('/auth/jobber',async(_req,reply)=>reply.redirect(deps.oauth.createAuthorizationUrl()));
 app.get<{Querystring:{code?:string;state?:string;error?:string}}>('/auth/jobber/callback',async(req,reply)=>{if(req.query.error)return reply.code(400).send({error:'Jobber authorization was declined.'});if(!req.query.code||!req.query.state||!deps.oauth.verifyState(req.query.state))return reply.code(400).send({error:'Invalid OAuth callback.'});await deps.oauth.exchangeCode(req.query.code);req.log.info({event:'jobber_oauth_completed'});return{connected:true,next:'Run npm run jobber:sync'};});
 app.post('/webhooks/jobber',async(req,reply)=>{const signature=req.headers['x-jobber-hmac-sha256'] as string|undefined;const raw=req.rawBody;if(!raw||!verifyJobberWebhook(raw,signature,deps.config.jobber.clientSecret)){req.log.warn({event:'webhook_rejected'});return reply.code(401).send({error:'Invalid webhook signature.'});}const payload=req.body as Record<string,any>;const topic=String(req.headers['x-jobber-topic']??payload.topic??payload.event??'unknown');const deliveryId=String(req.headers['x-jobber-webhook-id']??req.headers['x-jobber-delivery-id']??payload.webHookEventId??payload.id??'');if(!deliveryId)return reply.code(400).send({error:'Webhook delivery ID is required.'});const itemId=payload.itemId??payload.resourceId??payload.data?.id;const eventInput:{deliveryId:string;topic:string;externalAccountId?:string;externalItemId?:string;payload:Record<string,unknown>}={deliveryId,topic,payload};if(payload.accountId)eventInput.externalAccountId=String(payload.accountId);if(itemId)eventInput.externalItemId=String(itemId);const result=await deps.events.enqueue(eventInput);req.log.info({event:'webhook_received',topic,duplicate:result.duplicate});return reply.code(result.duplicate?200:202).send({accepted:true,duplicate:result.duplicate});});
 app.addHook('onRequest',async(req,reply)=>{if(req.url.startsWith('/internal/')||req.url.startsWith('/api/'))if(req.headers['x-internal-api-key']!==deps.config.internalApiKey)return reply.code(401).send({error:'Unauthorized'});});
 app.get('/api/clients',async(req)=>business.searchClients(String((req.query as any).q??'')));
 app.get<{Params:{id:string}}>('/api/clients/:id',async(req,reply)=>{const x=await business.getClientById(req.params.id);return x??reply.code(404).send({error:'Client not found'});});
 app.get('/api/invoices/open',()=>business.getOpenInvoices());
 app.get('/api/revenue',async(req,reply)=>{const q=req.query as any;if(!/^\d{4}-\d{2}-\d{2}$/.test(q.start??'')||!/^\d{4}-\d{2}-\d{2}$/.test(q.end??''))return reply.code(400).send({error:'start and end must be YYYY-MM-DD'});return{start:q.start,end:q.end,invoicedRevenue:await business.getRevenueBetweenDates(q.start,q.end)};});
 app.post('/internal/jobber/sync',async(_req,reply)=>{void deps.sync.syncAll().catch((error)=>app.log.error({event:'sync_failed',error:error instanceof Error?error.message:'unknown'}));return reply.code(202).send({accepted:true});});
 return app;
}
