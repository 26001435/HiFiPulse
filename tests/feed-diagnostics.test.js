const test = require('node:test');
const assert = require('node:assert/strict');
const { analyse } = require('../feed-diagnostics.js');

test('missing Provider in a published CSV is surfaced instead of inventing Wi-Fi labels', () => {
  const result = analyse(['Timestamp','Latitude','Longitude','Download'], [
    {Timestamp:'2026-11-02T00:00:00Z', Latitude:'3.125', Longitude:'101.660', Download:'20'}
  ], () => null);
  assert.deepEqual(result.missing, ['Provider']);
  assert.equal(result.wifi, 0);
  assert.match(result.message, /external writer/);
});

test('differentiate an empty feed from a feed with no qualifying campus Wi-Fi', () => {
  assert.match(analyse(['Provider','Download','Timestamp','Latitude','Longitude'], [], () => null).message, /no measurements/);
  const bad = analyse(['Provider','Download','Timestamp','Latitude','Longitude'],
    [{Provider:'Maxis', Download:'20'}], () => null);
  assert.match(bad.message, /none labelled Campus Wi-Fi/);
  const excluded = analyse(['Provider','Download','Timestamp','Latitude','Longitude'],
    [{Provider:'Campus Wi-Fi', Download:'', Timestamp:''}], () => null);
  assert.match(excluded.message, /none qualify/);
});

test('reports actual eligible shared rows, not local-only browser storage', () => {
  const row = {Provider:'Campus Wi-Fi', Download:'20'};
  const result = analyse(['Provider','Download','Timestamp','Latitude','Longitude'], [row], () => row);
  assert.equal(result.eligible, 1);
  assert.match(result.message, /across devices/);
});
