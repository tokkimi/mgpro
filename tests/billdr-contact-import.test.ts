import {test} from 'node:test';
import assert from 'node:assert/strict';
import {billdrClientPlan,contactNameKey,importUuid} from '../lib/billdr-contact-import';
import type {RecordItem} from '../lib/model';
test('same client is consolidated while all source project references and coordinates survive',()=>{
 const plan=billdrClientPlan([{nom:'Émilie Martin',Courriel:'old@example.com','Projets associés':'P24_01','Créé le':'2024-01-01'},{nom:'Emilie Martin',Courriel:'new@example.com','Projets associés':'P24_02, P24_03','Créé le':'2025-01-01'}],[]);
 assert.equal(plan.length,1);assert.deepEqual(plan[0].projectRefs,['P24_01','P24_02','P24_03']);assert.equal(plan[0].data.email,'new@example.com');assert.equal(plan[0].data.billdr_import.aliases.length,2);assert.equal(plan[0].data.billdr_import.emails.length,2);
});
test('existing client, projects and account links remain untouched and a second import is idempotent',()=>{
 const old={id:'kept',kind:'client',data:{name:'Anne Roy',email:'keep@example.com',address:'Adresse conservée',access:{client:true}},version:4} as unknown as RecordItem;
 const rows=[{nom:'Anne Roy',Courriel:'source@example.com','Projets associés':'P25_123'}];
 const first=billdrClientPlan(rows,[old])[0];assert.equal(first.id,'kept');assert.equal(first.data.email,'keep@example.com');assert.deepEqual(first.data.access,old.data.access);
 const again=billdrClientPlan(rows,[{...old,data:first.data}])[0];assert.deepEqual(again.data,first.data);assert.equal(again.data.billdr_import.aliases.length,1);
});
test('names are not merged just for sharing an email; IDs are stable UUIDs; ambiguous existing names stop import',()=>{
 assert.equal(billdrClientPlan([{nom:'Anne Roy',Courriel:'family@example.com'},{nom:'Paul Roy',Courriel:'family@example.com'}],[]).length,2);
 assert.equal(contactNameKey('Anne—Roy'),'anne roy');assert.match(importUuid('client:anne roy'),/^[\da-f]{8}-[\da-f]{4}-5[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
 assert.throws(()=>billdrClientPlan([{nom:'Anne Roy'}],[{kind:'client',id:'a',data:{name:'Anne Roy'}},{kind:'client',id:'b',data:{name:'Anne Roy'}}] as unknown as RecordItem[]),/Plusieurs fiches/);
});

test('imported employee contacts preserve their source fields without granting accounts',async()=>{
 const {professionalsFrom}=await import('../lib/directory');
 const result=professionalsFrom([{id:'source',kind:'employee',name:'Personne importée',source:{system:'billdr',fields:{role:'Travailleur'}}}]);
 assert.equal(result[0].kind,'employee');assert.equal(result[0].source?.system,'billdr');assert.equal('active' in result[0],false);
});
