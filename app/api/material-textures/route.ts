// Search the CC0 scanned-texture library (ambientCG) to choose another real photo for a material.
export async function GET(req:Request){
 const q=(new URL(req.url).searchParams.get('q')||'').trim().slice(0,60);
 if(!q)return Response.json({items:[]});
 try{
  const res=await fetch(`https://ambientcg.com/api/v2/full_json?type=Material&sort=Popular&limit=36&q=${encodeURIComponent(q)}&include=displayData`,{next:{revalidate:86400}});
  if(!res.ok)throw new Error(String(res.status));
  const json=await res.json();
  const items=(json.foundAssets||[]).map((a:any)=>({id:String(a.assetId),name:String(a.displayName||a.assetId),category:String(a.displayCategory||'')})).filter((a:any)=>/^[A-Za-z]{2,30}\d{3}[A-Z]?$/.test(a.id));
  return Response.json({items},{headers:{'Cache-Control':'public, s-maxage=86400'}});
 }catch{return Response.json({items:[],error:'Recherche indisponible pour le moment.'},{status:502})}
}
