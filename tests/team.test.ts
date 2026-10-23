import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyTeamPreference,teamPreferences,teamPreferenceSchema,filterTeam,autoAssignedMembers,memberActivePatch,memberProfilePatch,membershipPatch,memberExport,teamRate,memberTimesheets} from '../lib/team';
import type {RecordItem} from '../lib/model';
const a='00000000-0000-4000-8000-000000000101',b='00000000-0000-4000-8000-000000000102';
const worker={id:a,name:'Chloé',email:'chloe@example.com',role:'worker' as const,client_id:null,active:true};
test('team filtering uses profile activity and combines role with phone/job search',()=>{
 const pref={...emptyTeamPreference(),phone:'5141234567',job:'Charpente',autoAssign:true};
 const prefs=teamPreferences({[a]:pref,[b]:pref});
 const users=[worker,{...worker,id:b,name:'Archive',active:false},{...worker,id:'admin',role:'admin' as const}];
 assert.equal(filterTeam(users,prefs,'CHARPENTE','worker').length,1);
 assert.equal(filterTeam(users,prefs,'514','worker',true)[0].id,b);
 assert.deepEqual(autoAssignedMembers(users,prefs),[a]);
 assert.equal(filterTeam(users,prefs,'inexistant').length,0);
});
test('schedule and rates reject impossible hours, negative money and malformed preferences',()=>{
 const pref=emptyTeamPreference();pref.days[0].end='06:00';assert.equal(teamPreferenceSchema.safeParse(pref).success,false);
 pref.days[0].end='25:00';assert.equal(teamPreferenceSchema.safeParse(pref).success,false);
 pref.days[0].end='16:00';pref.rates[0].cost=-1;assert.equal(teamPreferenceSchema.safeParse(pref).success,false);
 assert.deepEqual(teamPreferences({bad:emptyTeamPreference(),[a]:{}}),{});
});
test('member mutations are strict and cannot smuggle roles or coerce strings to active flags',()=>{
 assert.equal(memberActivePatch.safeParse({id:a,active:'false'}).success,false);
 assert.equal(memberProfilePatch.safeParse({action:'profile',id:a,name:'Chloé',role:'admin'}).success,false);
 assert.equal(membershipPatch.safeParse({action:'membership',project_id:'invalid',user_id:a}).success,false);
 assert.equal(memberActivePatch.safeParse({id:a,active:false}).success,true);
});
test('rates choose project profile, fall back to general and never change historical hours',()=>{
 const pref=emptyTeamPreference();pref.rates=[{name:'Général',cost:50,billable:90},{name:'Cuisine',cost:65,billable:100}];
 assert.equal(teamRate({[a]:pref},a,'Cuisine'),65);assert.equal(teamRate({[a]:pref},a,'Autre'),50);
 const projects:RecordItem[]=[{id:'project',kind:'project',client_id:null,project_id:null,version:1,created_at:'2026-10-23T00:00:00Z',updated_at:'2026-10-23T00:00:00Z',data:{title:'Cuisine',operations:{timesheets:[{id:'t',date:'2026-10-23',person:'Chloé',personId:a,hours:8,hourlyRate:20,status:'Soumise'}]}}}];
 assert.equal(memberTimesheets(projects,a)[0].hourlyRate,20);
 assert.equal(memberTimesheets(projects,b).length,0);
 const csv=memberExport({...worker,name:'=FORMULA'},pref,projects);assert.ok(csv.includes('"\'=FORMULA"'));assert.ok(csv.includes('Cuisine'));
});
