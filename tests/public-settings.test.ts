import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publicSettings} from '../lib/public-settings';

test('public settings never serialize internal business records',()=>{
 const publicData=publicSettings({name:'MG Pro',phone:'514-317-6305',directory:[{email:'private@example.com'}],catalogue:[{cost:123}],internal_notes:'private'});
 assert.equal(publicData.name,'MG Pro');
 assert.equal(publicData.phone,'514-317-6305');
 assert.deepEqual(Object.keys(publicData).sort(),['name','phone','rbq','seo_description','seo_title']);
 assert.doesNotMatch(JSON.stringify(publicData),/private|catalogue|directory/);
});
