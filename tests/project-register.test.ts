import test from 'node:test';
import assert from 'node:assert/strict';
import type {RecordItem} from '../lib/model';
import {projectCivilDate,projectMilestones,projectTags} from '../lib/project-register';
const record=(id:string,kind:RecordItem['kind'],data:Record<string,unknown>,project_id:string|null=null)=>({id,kind,data,project_id,client_id:null,version:1,created_at:'2026-10-23T01:00:00Z',updated_at:'2026-10-23T01:00:00Z'} as RecordItem);
test('project dates use actual quote events, exclude other projects and do not invent completion',()=>{
 const p=record('p','project',{start:'2026-10-22',end:'2026-11-15'});
 const values=projectMilestones(p,[record('q','quote',{sent_at:'2026-10-21T01:00:00Z',signed_at:'2026-10-22T15:00:00Z'},'p'),record('other','quote',{sent_at:'2026-10-23T15:00:00Z'},'another'),record('draft','quote',{date:'2026-10-23'},'p')]);
 assert.deepEqual(values,{created:'2026-10-22',quoteSent:'2026-10-20',quoteSigned:'2026-10-22',start:'2026-10-22',completed:'',end:'2026-11-15'});
 assert.equal(projectCivilDate('2026-10-23'),'2026-10-23');
 assert.equal(projectCivilDate('invalid'),'');
});
test('project tags support legacy values without changing source records',()=>{
 const p=record('p','project',{tags:[' Cuisine ','Cuisine',null,42,'Résidentiel']});
 assert.deepEqual(projectTags(p),['Cuisine','Résidentiel']);
 assert.equal(p.data.tags[0],' Cuisine ');
 assert.deepEqual(projectTags(record('p','project',{tag:'Commercial'})),['Commercial']);
});
