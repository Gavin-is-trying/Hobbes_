import { definitions } from '../integrations/jobber/types/entities.js';
import type { WebhookEventStore } from '../integrations/jobber/webhooks/event-store.js';
import type { JobberSyncService } from '../integrations/jobber/sync/sync-service.js';
export class WebhookWorker{
 private timer?:NodeJS.Timeout;private running=false;
 constructor(private store:WebhookEventStore,private sync:JobberSyncService,private intervalMs=5000,private log:Pick<Console,'info'|'error'>=console){}
 start(){this.timer=setInterval(()=>void this.tick(),this.intervalMs);this.timer.unref();void this.tick();}
 stop(){if(this.timer)clearInterval(this.timer);}
 async tick():Promise<void>{if(this.running)return;this.running=true;try{const event=await this.store.claim();if(!event)return;try{const prefix=event.topic.toLowerCase().split(/[._/]/)[0];const definition=definitions.find((d)=>d.resource===prefix||d.resource.slice(0,-1)===prefix);if(!definition)throw new Error(`Unsupported Jobber webhook topic: ${event.topic}`);await this.sync.syncResource(definition);await this.store.complete(event.id);this.log.info(JSON.stringify({event:'webhook_processed',id:event.id,topic:event.topic}));}catch(error){await this.store.fail(event,error instanceof Error?error.message:'Unknown error');this.log.error(JSON.stringify({event:'webhook_failed',id:event.id,topic:event.topic}));}}finally{this.running=false;}}
}
