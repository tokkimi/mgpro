import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMeasure,normalizePlan,autoPlan,metricRooms} from '../lib/visit-ai';
import {planSchema} from '../lib/plan';
import {extractJson} from '../lib/ai';

test('measure answers are cleaned and ordered',()=>{
 const m=normalizeMeasure(extractJson('Voici :```json\n{"length":3.1,"width":4.25,"height":2.45,"confidence":"bonne","margin":8,"doors":1,"windows":2,"features":["îlot"],"references":["porte"],"observations":"ok","advice":"x"}\n```'))!;
 assert.equal(m.length,4.25);assert.equal(m.width,3.1);assert.equal(m.windows,2);
 assert.equal(normalizeMeasure({length:'abc',width:2}),null);
});

test('auto plan converts feet and never overlaps',()=>{
 const plan=autoPlan([{name:'Cuisine',length:12,width:10,height:8,unit:'pi'},{name:'Salon',length:5,width:4,height:2.5,unit:'m'},{name:'Salle de bain',length:2,width:2,unit:'m'}]);
 assert.ok(planSchema.safeParse(plan).success);
 assert.equal(plan.rooms[0].furniture,'kitchen');assert.equal(plan.rooms[0].length,3.66);
 assert.equal(metricRooms([]).length,1);
});

test('model plan is validated, overlapping geometry falls back to the auto layout',()=>{
 const good=normalizePlan({rooms:[{id:'a',name:'Cuisine',x:0,y:0,length:4,width:3,height:2.4,furniture:'kitchen',door:true,window:true},{id:'b',name:'Salon',x:4,y:0,length:5,width:4,height:2.4}],elements:[{kind:'island',label:'Îlot',x:1,y:1,length:1.8,width:.9,height:.91,phase:'new'},{kind:'bogus'}]},[])!;
 assert.equal(good.rooms.length,2);assert.equal(good.elements.length,1);
 const bad=normalizePlan({rooms:[{name:'A',x:0,y:0,length:4,width:4},{name:'B',x:1,y:1,length:4,width:4}]},[{name:'A',length:4,width:4,unit:'m'},{name:'B',length:4,width:4,unit:'m'}])!;
 assert.ok(bad.rooms[1].x>=4||bad.rooms[1].y>=4);
 assert.equal(normalizePlan({rooms:[]},[]),null);
});

import {layoutFromPositions,checkPlan,normalizeQuote,geometry} from '../lib/visit-ai';

test('rooms are placed exactly where they were said to be',()=>{
 const rooms=[{id:'k',name:'Cuisine',length:4,width:3,unit:'m'},{id:'s',name:'Salon',length:5,width:4,unit:'m',position:{ref:'k',side:'right' as const,align:'start' as const,door:true}},{id:'b',name:'Salle de bain',length:2,width:2,unit:'m',position:{ref:'k',side:'below' as const,align:'end' as const}},{id:'c',name:'Chambre',length:3,width:3,unit:'m',position:{ref:'s',side:'above' as const,align:'center' as const}}];
 const plan=autoPlan(rooms);
 const at=(id:string)=>plan.rooms.find(r=>r.id===id)!;
 // Chamber above the salon pushes everything down by 3 m.
 assert.deepEqual([at('k').x,at('k').y],[0,3]);
 assert.deepEqual([at('s').x,at('s').y],[4,3]);
 assert.deepEqual([at('b').x,at('b').y],[2,6]);
 assert.deepEqual([at('c').x,at('c').y],[5,0]);
 assert.equal(plan.elements.filter(e=>e.kind==='door').length,1);
 const checks=checkPlan(plan,rooms);
 assert.equal(checks.filter(c=>c.level==='error').length,0,JSON.stringify(checks));
 assert.ok(checks.some(c=>c.text.startsWith('Positions respectées')));
});

test('the model cannot move a fixed room nor change measured sizes',()=>{
 const rooms=[{id:'k',name:'Cuisine',length:4,width:3,unit:'m'},{id:'s',name:'Salon',length:5,width:4,unit:'m',position:{ref:'k',side:'right' as const}}];
 const plan=normalizePlan({rooms:[{id:'k',name:'Cuisine',x:9,y:9,length:7,width:7},{id:'s',name:'Salon',x:0,y:0,length:1,width:1}],elements:[]},rooms)!;
 assert.deepEqual(plan.rooms.map(r=>[r.x,r.y,r.length,r.width]),[[0,0,4,3],[4,0,5,4]]);
 assert.equal(checkPlan(plan,rooms).filter(c=>c.level==='error').length,0);
 // A wrong plan is reported.
 const wrong={...plan,rooms:[plan.rooms[0],{...plan.rooms[1],x:1}]};
 assert.ok(checkPlan(wrong,rooms).some(c=>c.level==='error'));
});

test('quote lines without price are dropped and geometry is computed',()=>{
 const q=normalizeQuote({lines:[{description:'Peinture',quantity:300,unit:'pi²',price:3.5},{description:'Rien',quantity:1,price:0}],exclusions:['Permis']})!;
 assert.equal(q.lines.length,1);assert.equal(q.exclusions[0],'Permis');
 const g=geometry([{name:'Cuisine',length:12,width:10,height:8,unit:'pi'}]);
 assert.equal(g[0].floor_sqft,120);assert.equal(g[0].perimeter_ft,44);
 assert.ok(g[0].wall_sqft_net<352&&g[0].wall_sqft_net>300);
 assert.equal(layoutFromPositions([]).placed.size,0);
});
