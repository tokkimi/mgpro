/** Stored display preferences are untrusted and may reference removed columns. */
export function validLedgerColumns<T extends string>(value:unknown,allowed:readonly T[],fallback:readonly T[]):T[]{
 const valid=Array.isArray(value)?[...new Set(value.filter((x):x is T=>typeof x==='string'&&allowed.includes(x as T)))]:[];
 return valid.length?valid:[...fallback];
}
export type DatePeriod='all'|'7d'|'4w'|'3m'|'12m'|'month'|'quarter'|'year'|'custom';
/** Inclusive periods, calculated on a civil date without browser/server timezone drift. */
export function ledgerDateRange(period:DatePeriod,today:string){
 const end=new Date(today+'T12:00:00Z');
 if(!Number.isFinite(end.getTime())||end.toISOString().slice(0,10)!==today)throw Error('Date invalide');
 if(period==='all'||period==='custom')return {from:'',to:''};
 const start=new Date(end);
 if(period==='7d'||period==='4w')start.setUTCDate(start.getUTCDate()-(period==='7d'?6:27));
 if(period==='3m'||period==='12m'){const day=start.getUTCDate();start.setUTCDate(1);start.setUTCMonth(start.getUTCMonth()-(period==='3m'?3:12));const last=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+1,0)).getUTCDate();start.setUTCDate(Math.min(day,last));}
 if(period==='month')start.setUTCDate(1);
 if(period==='quarter'){start.setUTCDate(1);start.setUTCMonth(Math.floor(start.getUTCMonth()/3)*3)}
 if(period==='year'){start.setUTCDate(1);start.setUTCMonth(0)}
 return {from:start.toISOString().slice(0,10),to:today};
}
