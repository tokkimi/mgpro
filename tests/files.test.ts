import test from 'node:test';
import assert from 'node:assert/strict';
import {newFileShare,authorizedShare,fileShares} from '../lib/file-share';
import {folderContent,folderNameError,customFolders,projectFiles,sortedFiles} from '../lib/files';
import type {RecordItem} from '../lib/model';
const project:RecordItem={id:'project',kind:'project',client_id:'client',project_id:null,data:{file_folders:['Plans signés']},version:1,created_at:'2026-01-01',updated_at:'2026-01-01'};
const doc=(id:string,folder:string,visibility='internal'):RecordItem=>({...project,id,kind:'document',project_id:project.id,data:{folder,name:'Même nom.pdf',visibility,mime:'application/pdf'}});
test('custom folders survive classification; identical filenames stay distinct and sharing is independent',()=>{
 const files=projectFiles(project,[doc('a','Plans signés'),doc('b','Plans signés','client'),{...doc('c','Plans signés'),project_id:'other'}]);
 assert.deepEqual(folderContent(files,'Plans signés').map(f=>f.id),['a','b']);
 assert.deepEqual(folderContent(files,'Partagé avec le client').map(f=>f.id),['b']);
 assert.deepEqual(customFolders(project),['Plans signés']);
 assert.equal(folderNameError(' plans signés ',['Plans signés']).length>0,true);
 assert.equal(folderNameError('../plans',[]).length>0,true);
 assert.equal(folderNameError('Permis',[]),'');
});
test('sort is stable, numeric and does not mutate original files',()=>{
 const files=projectFiles(project,[{...doc('b','Factures'),data:{name:'Photo 10',mime:'image/png'}},{...doc('a','Factures'),data:{name:'Photo 2',mime:'image/png'}}]);
 assert.deepEqual(sortedFiles(files,'name',1).map(f=>f.id),['a','b']);
 assert.deepEqual(files.map(f=>f.id),['b','a']);
 assert.deepEqual(sortedFiles(files,'name',-1).map(f=>f.id),['b','a']);
});
test('public link is a snapshot, expires, cannot be forged and can be revoked without revealing its secret',()=>{
 const ids=['a','a','b'],now=Date.parse('2026-10-23T00:00:00Z');const {share,secret}=newFileShare(ids,'Plans',now);ids.push('new');
 assert.deepEqual(share.documentIds,['a','b']);assert.equal(JSON.stringify(share).includes(secret),false);
 assert.equal(authorizedShare([share],secret,now)?.id,share.id);
 assert.equal(authorizedShare([share],secret,now+7*86400000),null);
 assert.equal(authorizedShare([share],secret.slice(0,-1)+'!',now),null);
 assert.equal(authorizedShare([share],newFileShare(['a'],'x',now).secret,now),null);
 assert.equal(authorizedShare([],secret,now),null);
 assert.deepEqual(fileShares({file_shares:[null,{},share]}),[share]);
});
