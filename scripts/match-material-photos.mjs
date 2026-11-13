// Matches each MG Pro surface reference to a real photo-scanned CC0 texture from ambientCG.
// Input: acg.json (ambientCG material list) + uniq.json ([cat, sub, name]). Output: material-photos.json
// {"cat|sub|name": {"a": assetId, "t": "#tint"?}}. Run where ambientcg.com is reachable.
import fs from 'node:fs';
const [acgPath,uniqPath,outPath]=process.argv.slice(2);
const acg=JSON.parse(fs.readFileSync(acgPath,'utf8'));
const uniq=JSON.parse(fs.readFileSync(uniqPath,'utf8'));
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const COLORS=[[/blanc pur|blanc brillant/,'#f4f4f2',['white']],[/blanc casse|ivoire|creme/,'#ece4d4',['white','beige']],[/blanc chaud/,'#efe7da',['white']],[/blanc/,'#f0efeb',['white']],[/greige/,'#c9bfb0',['beige','grey']],[/taupe/,'#94867a',['brown','grey']],[/gris perle|gris clair/,'#cfcfcc',['grey','light']],[/anthracite|graphite/,'#3d3f42',['dark','grey']],[/gris/,'#9c9c98',['grey']],[/noir/,'#232323',['black','dark']],[/bleu nuit|bleu fonce|bleu marine/,'#24344d',['blue','dark']],[/bleu clair|turquoise|lagon/,'#5fb3d1',['blue']],[/bleu/,'#6f8fb3',['blue']],[/vert sauge|sauge/,'#a5b39c',['green']],[/vert olive|olive/,'#6f7448',['green']],[/vert/,'#5c7a5f',['green']],[/terracotta|terre cuite/,'#b9643f',['orange','red']],[/rouge/,'#9e3b2f',['red']],[/beige|sable|lin\b/,'#d8c9ab',['beige','sand']],[/ocre/,'#c49449',['yellow']],[/rose/,'#dfc0b8',['pink']]];
// [regex on "sub name", categories, tags, avoid, tint?]
const R=[
 [/peinture piscine|liner|membrane armee|membrane pvc|gelcoat|coque polyester/,['Plastic','Painted Plaster','Tiles'],['smooth','clean'],['old','dirty'],'color'],
 [/mosaique/,['Tiles'],['mosaic','small','square'],['old'],'colorIfNamed'],
 [/zellige/,['Tiles'],['zellige','glazed','handmade','green','white'],['old']],
 [/metro|faience|carrelage mural|carreaux grand format|gres grand format/,['Tiles'],['white','wall','bathroom','glossy','clean'],['old','floor','dirty']],
 [/hexagonal/,['Tiles'],['hexagonal','hexagon'],['old']],
 [/ciment decor/,['Tiles'],['pattern','ornament','decorative','cement'],['old']],
 [/terre cuite|tomette|plaquette terre cuite/,['Tiles','Glazed Terracotta','Bricks'],['terracotta','red','orange','clay'],['old']],
 [/terrazzo/,['Terrazzo'],['terrazzo','clean'],[]],
 [/travertin/,['Travertine'],['travertine'],[]],
 [/onyx/,['Onyx'],[],[]],
 [/marbre noir|lvt marbre|effet marbre|marbre|calacatta|veine/,['Marble'],['marble','white','veined','clean'],['old','dirty']],
 [/quartzite|quartz|ultracompacte|ceramique claire|ceramique foncee|granit|pierre bleue/,['Granite','Terrazzo','Marble'],['polished','smooth','clean','granite'],['old','rough']],
 [/ardoise/,['Roofing Tiles','Rock','Tiles'],['slate','dark'],[]],
 [/tuile beton/,['Roofing Tiles'],['concrete','roof'],[]],
 [/tuile/,['Roofing Tiles'],['terracotta','clay','red','roof'],[]],
 [/zinc|joint debout|bac acier|bardage acier|bardage aluminium|palissade acier|panneaux acier|acier|aluminium|inox|corten/,['Corrugated Steel','Metal','Sheet Metal','Metal Plates','Painted Metal'],['metal','clean','brushed','steel'],['rust','old','dirty','damaged']],
 [/corten|rouille/,['Rust','Metal'],['rust'],[]],
 [/epdm|bitumineuse|membrane etancheite|etancheite liquide|membrane pvc|enrobe|asphalte/,['Asphalt','Road','Rubber'],['asphalt','black'],['road','markings','lines']],
 [/vegetalisee|gazon naturel|engazonnee|brise-vue vegetal/,['Grass','Moss'],['grass','green'],[]],
 [/gazon synthetique/,['Grass'],['grass','artificial','green'],[]],
 [/gravier|paillage mineral|sur gravier/,['Gravel'],['gravel','pebbles'],[]],
 [/paillage vegetal|ecorce/,['Wood Chips','Bark','Ground'],['bark','chips','mulch'],[]],
 [/pave|dalle beton|pas japonais|bloc talus/,['Paving Stones'],['paving','pavement','stones','grey'],['old','moss']],
 [/beton desactive|beton balaye|beton imprime|beton matrice|beton architectural|beton banche|beton reconstitue|pierre reconstituee/,['Concrete','Paving Stones'],['concrete','rough','exposed'],[]],
 [/pierre seche|gabion|pierre de lave|mur pierre/,['Rock','Rocks','Bricks'],['stone','wall','rock'],[]],
 [/pierre calcaire|pierre naturelle|dalle pierre|parement pierre|effet pierre|pierre\b|vinyle pierre|gres cerame pierre/,['Tiles','Paving Stones','Bricks','Rock'],['stone','limestone','beige','natural'],['old','moss','dirty']],
 [/brique blanche/,['Bricks','Painted Bricks'],['white','bricks','painted'],[]],
 [/brique ancienne/,['Bricks'],['old','bricks','red'],[]],
 [/brique|terre crue|parpaing|blocs a bancher/,['Bricks'],['bricks','red','clean'],['painted']],
 [/beton cire|beton poli|microciment|effet beton|lvt beton|gres cerame beton|beton quartze|beton brut|beton arme|beton\b|dalle beton|radier|semelles|plots beton/,['Concrete'],['concrete','smooth','polished','grey','clean'],['dirty','damaged','cracked']],
 [/resine|epoxy|polyurethane|flocons/,['Concrete','Plastic','Terrazzo'],['epoxy','resin','smooth','floor','polished'],['dirty']],
 [/caoutchouc|dalle pvc|pvc homogene|lino|sol drainant/,['Rubber','Plastic'],['rubber','floor'],[]],
 [/moquette|dalles textiles|acoustique feutre|feutre/,['Carpet','Fabric'],['carpet'],[]],
 [/papier peint|textile|velours/,['Wallpaper','Fabric'],['wallpaper','fabric'],[]],
 [/liege/,['Cork'],['cork'],[]],
 [/bambou/,['Bamboo','Wood Floor'],['bamboo'],[]],
 [/point de hongrie|chevron/,['Wood Floor'],['herringbone','chevron','parquet'],[]],
 [/batons rompus/,['Wood Floor'],['herringbone','parquet'],[]],
 [/lame composite|bois composite|composite|claustra composite/,['Planks','Wood','Wood Siding'],['planks','composite','grey','decking'],['old','damaged']],
 [/lame bois|bois thermotraite|terrasse|sur plots|sur lambourdes|ipe|cumaru|meleze|traverse bois|claustra bois|canisse/,['Planks','Wood'],['planks','decking','outdoor','wood'],['old','damaged','painted']],
 [/bardage bois|bois vertical|bois horizontal|ossature bois|clt|lambris|lames verticales|tasseaux|cannele/,['Wood Siding','Planks','Wood'],['wood','siding','planks','facade'],['old','damaged','painted']],
 [/fibre ciment|hpl|panneau sandwich|panneau fibre/,['Facade','Concrete'],['facade','panel','modern'],[]],
 [/crepi|enduit|stuc|chaux|tadelakt|platre|ite enduit|mur enduit|effet sable|argile|minerale/,['Plaster','Painted Plaster','Facade'],['plaster','wall','rough','stucco'],['damaged','dirty','old']],
 [/gres cerame|carrelage|ceramique|dalle gres/,['Tiles'],['tiles','floor','clean','modern','large'],['old','dirty','mosaic']],
 [/vitrage|verre|polycarbonate|depoli|lanterneau/,['Plastic','Tiles'],['glass','translucent'],[],'#bcd4dc'],
 [/stratifie|vinyle chene|parquet|chene|noyer|frene|hetre|teck|pin\b|bois|mdf|panneau 3d|plancher bois/,['Wood Floor','Wood','Planks'],['wood','floor','parquet','oak','clean'],['old','damaged','dirty','painted']],
 [/peinture|mat|satin|brillant|lessivable|anti|faux plafond|plafond tendu|dalles acoustiques|isole|blanc|gris|noir|bleu|vert|greige|taupe|terracotta|anthracite|sable|couleur/,['Painted Plaster','Plaster','Paint'],['white','smooth','painted','wall','clean'],['damaged','dirty','old','cracked'],'color'],
];
const WOODTONE=[[/blanchi|clair|frene|erable|bouleau|pin|hetre|meleze/,['light','white','beige']],[/fume|fonce|noyer|wenge|teck|ipe|cumaru/,['dark','brown']],[/huile|naturel|verni|chene/,['brown','natural','oak']]];
const scored=(q,salt)=>{
 const cands=acg.map(a=>{let s=0;const tags=new Set(a.tags);if(q.cats.includes(a.cat))s+=10-q.cats.indexOf(a.cat);for(const t of q.tags)if(tags.has(t))s+=2;for(const t of q.avoid)if(tags.has(t))s-=4;if(a.method==='PBRPhotogrammetry'||a.method==='PBRApproximated')s+=.5;return {a,s}}).filter(x=>x.s>=8).sort((x,y)=>y.s-x.s);
 if(!cands.length)return null;const top=cands.filter(x=>x.s>=cands[0].s-2).slice(0,6);let h=0;for(const ch of salt)h=(h*31+ch.charCodeAt(0))>>>0;return top[h%top.length].a.id;
};
const out={};let miss=[];
for(const [cat,sub,name] of uniq){
 const n=norm(`${sub} ${name}`),nn=norm(name);
 const rule=R.find(([re])=>re.test(nn))||R.find(([re])=>re.test(n));
 if(!rule){miss.push(`${cat}|${sub}|${name}`);continue}
 const [,cats,tags,avoid,tintMode]=rule;const t=[...tags];let tint;
 const col=COLORS.find(([re])=>re.test(nn));
 if(col)t.push(...col[2]);
 const wood=/wood|planks|parquet/.test(tags.join(' '))&&WOODTONE.find(([re])=>re.test(nn));if(wood)t.push(...wood[1]);
 if(tintMode==='color'||(tintMode==='colorIfNamed'&&col))tint=col?.[1];
 else if(typeof tintMode==='string'&&tintMode.startsWith('#'))tint=tintMode;
 const id=scored({cats,tags:t,avoid},`${sub}${name}`);
 if(!id){miss.push(`${cat}|${sub}|${name}`);continue}
 out[`${cat}|${sub}|${name}`]=tint?{a:id,t:tint}:{a:id};
}
fs.writeFileSync(outPath,JSON.stringify(out));
console.log('matched',Object.keys(out).length,'missed',miss.length);console.log(miss.join('\n'));
const use={};for(const v of Object.values(out))use[v.a]=(use[v.a]||0)+1;console.log('distinct assets',Object.keys(use).length);
