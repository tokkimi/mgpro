import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readRecordPages} from '../lib/record-pages';

test('workspace reads all 1,850 records beyond the server row cap',async()=>{
 const source=Array.from({length:1850},(_,i)=>({id:String(i).padStart(5,'0')}));
 const cursors:(string|null)[]=[];
 const records=await readRecordPages(async(after,size)=>{cursors.push(after);return {data:source.filter(r=>!after||r.id>after).slice(0,size),error:null}});
 assert.deepEqual(records,source);assert.equal(cursors.length,4);
});
test('a later page failure never returns an incomplete workspace',async()=>{
 await assert.rejects(readRecordPages(async after=>after?{data:null,error:new Error('unavailable')}:{data:[{id:'a'},{id:'b'}],error:null},2),/impossible/);
});
test('an exhausted full page terminates and a repeated cursor is refused',async()=>{
 assert.deepEqual(await readRecordPages(async after=>({data:after?[]:[{id:'a'},{id:'b'}],error:null}),2),[{id:'a'},{id:'b'}]);
 await assert.rejects(readRecordPages(async()=>({data:[{id:'a'},{id:'b'}],error:null}),2),/Ordre/);
});
