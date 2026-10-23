import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
export type FileShare={id:string;hash:string;documentIds:string[];label:string;expiresAt:string;createdAt:string};
export const hashShare=(secret:string)=>createHash('sha256').update(secret).digest('hex');
export function newFileShare(documentIds:string[],label:string,now=Date.now()){
 const secret=randomBytes(32).toString('base64url');
 const share:FileShare={id:crypto.randomUUID(),hash:hashShare(secret),documentIds:[...new Set(documentIds)],label:label.slice(0,180),createdAt:new Date(now).toISOString(),expiresAt:new Date(now+7*86400000).toISOString()};
 return {share,secret};
}
export function authorizedShare(shares:FileShare[],secret:string,now=Date.now()){
 if(!/^[A-Za-z0-9_-]{43}$/.test(secret))return null;
 const hash=Buffer.from(hashShare(secret),'hex');
 return shares.find(s=>/^[a-f0-9]{64}$/.test(s.hash)&&timingSafeEqual(Buffer.from(s.hash,'hex'),hash)&&Date.parse(s.expiresAt)>now)||null;
}
export function fileShares(data:Record<string,unknown>):FileShare[]{
 return Array.isArray(data.file_shares)?data.file_shares.filter((s):s is FileShare=>!!s&&typeof s==='object'&&typeof s.hash==='string'&&Array.isArray(s.documentIds)&&typeof s.expiresAt==='string'):[];
}
