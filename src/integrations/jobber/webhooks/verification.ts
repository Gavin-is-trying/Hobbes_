import { createHmac, timingSafeEqual } from 'node:crypto';
export function verifyJobberWebhook(rawBody:Buffer, supplied:string|undefined, secret:string):boolean{
 if(!supplied)return false; const expected=createHmac('sha256',secret).update(rawBody).digest();
 let actual:Buffer;try{actual=Buffer.from(supplied,'base64');}catch{return false;}
 return actual.length===expected.length&&timingSafeEqual(actual,expected);
}
