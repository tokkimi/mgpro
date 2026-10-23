/** Keyset pagination avoids the Data API's per-request row cap. Never return a silently truncated workspace. */
export async function readRecordPages<T extends {id:string}>(fetchPage:(after:string|null,size:number)=>PromiseLike<{data:T[]|null;error:unknown}>,size=500):Promise<T[]> {
 const records:T[]=[];
 let after:string|null=null;
 for(let page=0;page<100;page++){
  const result=await fetchPage(after,size);
  if(result.error||!result.data)throw new Error('Chargement des dossiers impossible.');
  const rows=result.data;
  if(rows.some((row,index)=>!row.id||row.id<=(index?rows[index-1].id:after||'')))throw new Error('Ordre des dossiers invalide.');
  records.push(...rows);
  if(rows.length<size)return records;
  after=rows[rows.length-1].id;
 }
 throw new Error('Le nombre de dossiers dépasse la limite de chargement.');
}
