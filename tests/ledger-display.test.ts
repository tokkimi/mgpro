import test from 'node:test';
import assert from 'node:assert/strict';
import {validLedgerColumns} from '../lib/ledger-display';
test('ledger column preference rejects obsolete names, duplicates and malformed values',()=>{
 const allowed=['reference','date','total'] as const;
 assert.deepEqual(validLedgerColumns(['removed','date','date',null],allowed,['reference']),['date']);
 assert.deepEqual(validLedgerColumns(['removed'],allowed,['reference']),['reference']);
 assert.deepEqual(validLedgerColumns({date:true},allowed,['reference']),['reference']);
});

test('expense date presets handle civil month boundaries and inclusive weeks',async()=>{
 const {ledgerDateRange}=await import('../lib/ledger-display');
 assert.deepEqual(ledgerDateRange('7d','2026-10-23'),{from:'2026-10-17',to:'2026-10-23'});
 assert.deepEqual(ledgerDateRange('3m','2026-05-31'),{from:'2026-02-28',to:'2026-05-31'});
 assert.deepEqual(ledgerDateRange('quarter','2026-10-23'),{from:'2026-10-01',to:'2026-10-23'});
 assert.deepEqual(ledgerDateRange('all','2026-10-23'),{from:'',to:''});
 assert.throws(()=>ledgerDateRange('month','2026-02-31'));
});
