import type { Queryable } from '../database/client.js';
export interface Client {jobberId:string;name:string;email:string|null;phone:string|null;isActive:boolean;address:string|null;city:string|null}
export interface Invoice {jobberId:string;invoiceNumber:string|null;clientJobberId:string|null;status:string;total:number;balance:number;issuedDate:string|null;dueDate:string|null}
const client=(x:any):Client=>({jobberId:x.jobber_id,name:x.name,email:x.email,phone:x.phone,isActive:x.is_active,address:x.billing_address,city:x.city});
const invoice=(x:any):Invoice=>({jobberId:x.jobber_id,invoiceNumber:x.invoice_number,clientJobberId:x.client_jobber_id,status:x.status,total:Number(x.total),balance:Number(x.balance),issuedDate:x.issued_date,dueDate:x.due_date});
export class BusinessService{
 constructor(private db:Queryable){}
 async searchClients(search='',limit=100):Promise<Client[]>{const r=await this.db.query(`SELECT * FROM clients WHERE $1='' OR name ILIKE '%'||$1||'%' OR company_name ILIKE '%'||$1||'%' OR email ILIKE '%'||$1||'%' ORDER BY name LIMIT $2`,[search,Math.min(limit,500)]);return r.rows.map(client);}
 async getClientById(id:string):Promise<Client|null>{const r=await this.db.query('SELECT * FROM clients WHERE jobber_id=$1',[id]);return r.rows[0]?client(r.rows[0]):null;}
 async getActiveClients():Promise<Client[]>{const r=await this.db.query('SELECT * FROM clients WHERE is_active=true AND archived_at IS NULL ORDER BY name');return r.rows.map(client);}
 async getActiveClientCount():Promise<number>{const r=await this.db.query('SELECT count(*)::int AS count FROM clients WHERE is_active=true AND archived_at IS NULL');return r.rows[0].count;}
 async findClientsByAddress(search:string):Promise<Client[]>{const r=await this.db.query(`SELECT * FROM clients WHERE concat_ws(' ',billing_address,city,province,postal_code) ILIKE '%'||$1||'%' ORDER BY name`,[search]);return r.rows.map(client);}
 async getClientProperties(clientId:string){return (await this.db.query('SELECT * FROM properties WHERE client_jobber_id=$1 ORDER BY address',[clientId])).rows;}
 async searchJobs(search=''){return (await this.db.query(`SELECT * FROM jobs WHERE $1='' OR title ILIKE '%'||$1||'%' OR job_number ILIKE '%'||$1||'%' ORDER BY start_at DESC NULLS LAST LIMIT 500`,[search])).rows;}
 async getJobById(id:string){return (await this.db.query('SELECT * FROM jobs WHERE jobber_id=$1',[id])).rows[0]??null;}
 async searchInvoices(search=''):Promise<Invoice[]>{const r=await this.db.query(`SELECT * FROM invoices WHERE $1='' OR invoice_number ILIKE '%'||$1||'%' OR subject ILIKE '%'||$1||'%' ORDER BY issued_date DESC NULLS LAST LIMIT 500`,[search]);return r.rows.map(invoice);}
 async getOpenInvoices():Promise<Invoice[]>{const r=await this.db.query('SELECT * FROM invoices WHERE balance>0 ORDER BY due_date NULLS LAST');return r.rows.map(invoice);}
 async getRevenueBetweenDates(start:string,end:string):Promise<number>{const r=await this.db.query('SELECT coalesce(sum(total),0)::text AS revenue FROM invoices WHERE issued_date >= $1::date AND issued_date < $2::date',[start,end]);return Number(r.rows[0].revenue);}
 async getRevenueByClient(start?:string,end?:string){return (await this.db.query(`SELECT c.jobber_id,c.name,coalesce(sum(i.total),0)::text AS revenue FROM clients c JOIN invoices i ON i.client_jobber_id=c.jobber_id WHERE ($1::date IS NULL OR i.issued_date >= $1) AND ($2::date IS NULL OR i.issued_date < $2) GROUP BY c.jobber_id,c.name ORDER BY sum(i.total) DESC`,[start??null,end??null])).rows.map((x:any)=>({...x,revenue:Number(x.revenue)}));}
 async getClientServiceHistory(clientId:string){const r=await this.db.query(`SELECT v.* FROM visits v JOIN jobs j ON j.jobber_id=v.job_jobber_id WHERE j.client_jobber_id=$1 ORDER BY v.start_at DESC NULLS LAST`,[clientId]);return r.rows;}
}
