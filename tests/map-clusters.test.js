const test = require('node:test');
const assert = require('node:assert/strict');
const clusters = require('../map-clusters.js');
const row = (lat, lon, accuracy = 30) => ({ lat, lon, accuracy, download: 10 });

test('nearby rounded fixes share an approximate location and keep every test', () => {
  const a = row(3.125, 101.660), b = row(3.126, 101.661);
  const groups = clusters.group([b, a], 160);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].records.length, 2);
  assert.ok(Math.abs(groups[0].lat - 3.1255) < 1e-9);
  assert.ok(Math.abs(groups[0].lon - 101.6605) < 1e-9);
  assert.equal(clusters.group([a, b], 160).length, 1);
});

test('distant areas are not chained through intermediary fixes', () => {
  const groups = clusters.group([
    row(3.123, 101.659), row(3.124, 101.659), row(3.125, 101.659),
    row(3.129, 101.661)
  ], 160);
  assert.equal(groups.length, 3);
  assert.deepEqual(groups.map(g => g.records.length), [2,1,1]);
});

test('coarse fixes stay separate; legacy unknown-accuracy rows only merge exactly', () => {
  const coarse = row(3.125, 101.660, 5000);
  const exact = row(3.125, 101.660, null);
  const near = row(3.126, 101.660, null);
  const groups = clusters.group([coarse, coarse, exact, exact, near], 160);
  assert.deepEqual(groups.map(g => g.records.length), [1,1,2,1]);
});
