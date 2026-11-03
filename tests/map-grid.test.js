const test = require('node:test');
const assert = require('node:assert/strict');
const grid = require('../map-grid.js');
const row = (lat, lon, download, accuracy = 40) => ({ lat, lon, download, accuracy });

test('only observed, usable GPS cells are shaded; uncertainty remains list-only', () => {
  const rows = [row(3.125, 101.660, 8), row(3.125, 101.660, 20),
    row(3.125, 101.660, null), row(3.126, 101.660, 50, null),
    row(3.127, 101.661, 12, 900)];
  const cells = grid.cells(rows);
  assert.equal(cells.length, 1);
  assert.equal(cells[0].records.length, 3);
  assert.equal(cells[0].measured, 2);
  assert.equal(cells[0].incomplete, 1);
  assert.equal(cells[0].median, 14);
  assert.deepEqual(cells[0].bounds, [[3.125, 101.66], [3.126, 101.661]]);
  assert.deepEqual(rows.map(r => r.download), [8, 20, null, 50, 12]);
});

test('incomplete-only cell is never zero speed, and nearby empty bins are not inferred', () => {
  const cells = grid.cells([row(3.123, 101.659, null), row(3.127, 101.663, 60)]);
  assert.equal(cells.length, 2);
  assert.equal(cells.find(c => c.incomplete).median, null);
});

test('bins respect recorded accuracy and deterministic boundaries', () => {
  assert.equal(grid.eligible(row(3.125, 101.66, 3, 200)), true);
  assert.equal(grid.eligible(row(3.125, 101.66, 3, 201)), false);
  assert.equal(grid.eligible(row(3.125, 101.66, 3, null)), false);
  assert.equal(grid.eligible(row(3.12, 101.66, 3, 30)), false); // old two-decimal writer
  assert.notEqual(grid.cells([row(3.125, 101.66, 3), row(3.126, 101.66, 3)])[0].key,
    grid.cells([row(3.126, 101.66, 3)])[0].key);
});
