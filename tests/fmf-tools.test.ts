import test from 'node:test';
import assert from 'node:assert/strict';
import type {RecordItem,Profile} from '../lib/model';
import {projectHealth} from '../lib/project-health';
import {autoReminderDue,clientDecisions,invoiceState,manualReminderAllowed,reminderSettingsFrom} from '../lib/billing';
import {weeklyReportDraft} from '../lib/weekly-report';
import {redact} from '../lib/redact';

const rec=(id:string,kind:any,data:any,project_id:string|null=null,client_id:string|null='c1',updated='2026-10-07T12:00:00Z'):RecordItem=>({id,kind,data,client_id,project_id,version:1,created_at:'2026-09-01T00:00:00Z',updated_at:updated});
const inv=(data:any)=>({lines:[{quantity:1,price:1000}],tps:5,tvq:9.975,status:'Émise',date:'2026-09-01',due:'2026-10-01',paid:0,...data});

test('invoice state is derived from dates and payments, never from a button',()=>{
 assert.equal(invoiceState(inv({}),'2026-09-15'),'Émise');
 assert.equal(invoiceState(inv({first_viewed_at:'2026-09-02'}),'2026-09-15'),'Vue');
 assert.equal(invoiceState(inv({paid:200}),'2026-09-15'),'Partiellement payée');
 assert.equal(invoiceState(inv({}),'2026-10-08'),'En retard');
 assert.equal(invoiceState(inv({paid:1149.75}),'2026-10-08'),'Payée');
 assert.equal(invoiceState(inv({status:'Brouillon'}),'2026-10-08'),'Brouillon');
});

test('automatic reminders: once per offset, 2-day grace, nothing when disabled or paid',()=>{
 const rules=reminderSettingsFrom({enabled:true,offsets:[-3,0,7]});
 assert.equal(autoReminderDue(inv({}),rules,'2026-09-28'),-3);
 assert.equal(autoReminderDue(inv({}),rules,'2026-10-01'),0);
 assert.equal(autoReminderDue(inv({reminders:[{at:'2026-10-01',kind:'automatique',offset:0,to:'x',status:'envoyé'}]}),rules,'2026-10-02'),null,'already sent for this offset');
 assert.equal(autoReminderDue(inv({}),rules,'2026-10-20'),null,'old offsets are not replayed');
 assert.equal(autoReminderDue(inv({}),reminderSettingsFrom({enabled:false}),'2026-10-01'),null);
 assert.equal(autoReminderDue(inv({paid:1149.75}),rules,'2026-10-01'),null);
 assert.equal(manualReminderAllowed({reminders:[{at:new Date(Date.now()-3600_000).toISOString(),kind:'manuel',offset:null,to:'x',status:'envoyé'}]}),false);
 assert.equal(manualReminderAllowed({reminders:[{at:new Date(Date.now()-3600_000).toISOString(),kind:'manuel',offset:null,to:'x',status:'échec'}]}),true,'a failed send does not block a retry');
});

test('client decisions list approvals, signatures, choices and payments oldest first',()=>{
 const records=[rec('q','quote',{status:'Envoyé',number:'S-1',sent_at:'2026-09-28',lines:[{quantity:1,price:100}]},'p'),rec('k','contract',{status:'Envoyé',title:'Cuisine',sent_at:'2026-10-06'},'p'),rec('i','invoice',inv({number:'F-1'}),'p'),rec('p','project',{title:'Cuisine',selections:[{id:'s',title:'Comptoir',published:true,published_at:'2026-10-03'}]},null)];
 const items=clientDecisions(records,'2026-10-08');
 assert.deepEqual(items.map(i=>i.kind),['Approbation','Paiement','Choix','Signature']);
 assert.equal(items[0].days,10);
});

test('project health scores delays, overdue tasks, client waits and budget',()=>{
 const project=rec('p','project',{title:'Cuisine',status:'En cours',start:'2026-09-01',end:'2026-10-11',operations:{costCodes:[{id:'c',code:'01',name:'Général',budget:10000}],vendorBills:[{id:'b',reference:'V',supplier:'S',issuedOn:'2026-09-10',subtotal:9000,tax:0,status:'À payer'}]}});
 const records=[project,rec('t1','task',{title:'A',status:'Validée'},'p'),rec('t2','task',{title:'B',status:'À faire',due:'2026-10-01'},'p'),rec('t3','task',{title:'C',status:'À faire',due:'2026-10-20'},'p'),rec('q','quote',{status:'Envoyé',sent_at:'2026-09-20',lines:[]},'p')];
 const h=projectHealth(project,records,'2026-10-08');
 assert.equal(h.progress,33);
 assert.equal(h.expected,93);
 assert.equal(h.overdueTasks,1);
 assert.ok(h.alerts.some(a=>a.kind==='schedule'&&a.level==='danger'));
 assert.ok(h.alerts.some(a=>a.kind==='client'));
 assert.ok(h.alerts.some(a=>a.kind==='budget'));
 assert.equal(h.status,'off_track');
 assert.ok(h.score<50);
 const done=projectHealth(rec('d','project',{title:'Fini',status:'Terminé'}),[],'2026-10-08');
 assert.equal(done.status,'done');
});

test('weekly report draft summarises the week and is empty when nothing happened',()=>{
 const project=rec('p','project',{title:'Cuisine',operations:{dailyLogs:[{id:'l',date:'2026-10-06',summary:'Pose des armoires'}]}});
 const records=[project,rec('t1','task',{title:'Démolition',status:'Validée'},'p','c1','2026-10-05T10:00:00Z'),rec('t2','task',{title:'Plomberie',status:'En cours'},'p'),rec('t3','task',{title:'Peinture',status:'À faire',due:'2026-10-15'},'p')];
 const draft=weeklyReportDraft(project,records,'2026-10-08');
 assert.match(draft.notes,/Réalisé cette semaine\n• Démolition\n• Pose des armoires/);
 assert.match(draft.notes,/En cours\n• Plomberie/);
 assert.match(draft.notes,/Peinture \(2026-10-15\)/);
 assert.equal(weeklyReportDraft(rec('x','project',{}),[],'2026-10-08').empty,true);
});

test('client requests are visible to the client only, never to field workers',()=>{
 const project=rec('p','project',{title:'X',client_requests:[{id:'r',title:'Ajouter une prise',status:'Nouvelle',createdAt:'2026-10-01',author:'Client'}]},null,'c1');
 const client:Profile={id:'u',name:'C',email:'c@x.test',role:'client',client_id:'c1'};
 const worker:Profile={id:'w',name:'W',email:'w@x.test',role:'worker',client_id:null};
 assert.equal(redact(client,project).data.client_requests.length,1);
 assert.deepEqual(redact(worker,project).data.client_requests,[]);
});
