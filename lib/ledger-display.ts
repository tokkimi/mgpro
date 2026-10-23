/** Stored display preferences are untrusted and may reference removed columns. */
export function validLedgerColumns<T extends string>(value:unknown,allowed:readonly T[],fallback:readonly T[]):T[]{
 const valid=Array.isArray(value)?[...new Set(value.filter((x):x is T=>typeof x==='string'&&allowed.includes(x as T)))]:[];
 return valid.length?valid:[...fallback];
}
