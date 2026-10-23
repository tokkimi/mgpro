import test from 'node:test';
import assert from 'node:assert/strict';
import {validLedgerColumns} from '../lib/ledger-display';
test('ledger column preference rejects obsolete names, duplicates and malformed values',()=>{
 const allowed=['reference','date','total'] as const;
 assert.deepEqual(validLedgerColumns(['removed','date','date',null],allowed,['reference']),['date']);
 assert.deepEqual(validLedgerColumns(['removed'],allowed,['reference']),['reference']);
 assert.deepEqual(validLedgerColumns({date:true},allowed,['reference']),['reference']);
});
