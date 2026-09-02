import type { Queryable } from '../client.js';
import type { MirrorRecord, Resource } from '../../integrations/jobber/types/entities.js';
const columns:Record<Resource,readonly string[]>={
 clients:['name','first_name','last_name','company_name','email','phone','is_active','billing_address','city','province','postal_code','archived_at'],
 properties:['client_jobber_id','address','city','province','postal_code','is_active'],
 jobs:['client_jobber_id','property_jobber_id','job_number','title','status','start_at','end_at','closed_at'],
 visits:['job_jobber_id','title','status','start_at','end_at','completed_at'],
 quotes:['client_jobber_id','quote_number','title','status','total','created_date','sent_at','approved_at'],
 invoices:['client_jobber_id','invoice_number','subject','status','total','balance','issued_date','due_date','paid_at'],
 payments:['client_jobber_id','invoice_jobber_id','amount','paid_at','payment_method']
};
export class MirrorRepository {
 constructor(private db:Queryable) {}
 async upsert(resource:Resource, record:MirrorRecord):Promise<void>{
   const names=columns[resource]; const values=names.map((n)=>record.fields[n]??null);
   const inserted=['jobber_id',...names,'source_payload','source_updated_at'];
   const params=[record.jobberId,...values,JSON.stringify(record.sourcePayload),record.sourceUpdatedAt];
   const updates=[...names,'source_payload','source_updated_at'].map((n)=>`${n}=excluded.${n}`).concat('synced_at=now()');
   await this.db.query(`INSERT INTO ${resource}(${inserted.join(',')}) VALUES(${params.map((_,i)=>`$${i+1}`).join(',')}) ON CONFLICT(jobber_id) DO UPDATE SET ${updates.join(',')}`,params);
 }
 async start(resource:Resource):Promise<void>{await this.db.query(`INSERT INTO jobber_sync_state(resource,status,last_started_at,records_processed,error) VALUES($1,'running',now(),0,NULL) ON CONFLICT(resource) DO UPDATE SET status='running',last_started_at=now(),records_processed=0,error=NULL,updated_at=now()`,[resource]);}
 async finish(resource:Resource,count:number):Promise<void>{await this.db.query(`UPDATE jobber_sync_state SET status='succeeded',records_processed=$2,last_completed_at=now(),last_success_at=now(),error=NULL,updated_at=now() WHERE resource=$1`,[resource,count]);}
 async fail(resource:Resource,error:string):Promise<void>{await this.db.query(`UPDATE jobber_sync_state SET status='failed',last_completed_at=now(),error=$2,updated_at=now() WHERE resource=$1`,[resource,error.slice(0,1000)]);}
}
