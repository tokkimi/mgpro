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
