const test = require('node:test');
const assert = require('node:assert/strict');
const { layout } = require('../map-clusters.js');
const project = (lat, lon) => ({ x: lon * 100, y: lat * 100 });
const row = (lat, lon, id) => ({ lat, lon, id });

test('overlapping fixes remain separate tests with untouched coordinates', () => {
  const rows = [row(3.125, 101.660, 'a'), row(3.125, 101.660, 'b')];
  const placed = layout(rows, project);
  assert.equal(placed.length, 2);
  assert.deepEqual(placed.map(p => p.record), rows);
  assert.ok(placed.every(p => p.displaced));
  assert.notDeepEqual([placed[0].x, placed[0].y], [placed[1].x, placed[1].y]);
  assert.deepEqual(rows.map(r => [r.lat, r.lon]), [[3.125, 101.660], [3.125, 101.660]]);
});

test('distant fixes stay at their measured screen positions', () => {
  const rows = [row(3, 101, 'a'), row(5, 105, 'b')];
  const placed = layout(rows, project);
  assert.ok(placed.every(p => !p.displaced));
  assert.deepEqual(placed.map(p => [p.x, p.y]), rows.map(r => [r.lon * 100, r.lat * 100]));
});

test('large overlapping sets expose every individual marker', () => {
  const rows = Array.from({ length: 23 }, (_, i) => row(3.125, 101.66, String(i)));
  const placed = layout(rows, project);
  assert.equal(placed.length, rows.length);
  assert.equal(new Set(placed.map(p => `${p.x},${p.y}`)).size, rows.length);
});
