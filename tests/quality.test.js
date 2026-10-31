const test = require('node:test');
const assert = require('node:assert/strict');
const { rate } = require('../quality.js');

test('download and upload reward higher measured speeds', () => {
  for (const [metric, low, high] of [['download', 15, 50], ['upload', 5, 20]]) {
    assert.equal(rate(metric, low - 0.01).key, 'poor');
    assert.equal(rate(metric, low).key, 'fair');
    assert.equal(rate(metric, high - 0.01).key, 'fair');
    assert.equal(rate(metric, high).key, 'excellent');
    assert.ok(rate(metric, 0).fill < rate(metric, low).fill);
    assert.ok(rate(metric, low).fill < rate(metric, high).fill);
  }
});

test('ping and jitter reward lower latency variation', () => {
  for (const [metric, excellent, poor] of [['ping', 40, 120], ['jitter', 10, 30]]) {
    assert.equal(rate(metric, excellent).key, 'excellent');
    assert.equal(rate(metric, excellent + 0.01).key, 'fair');
    assert.equal(rate(metric, poor).key, 'fair');
    assert.equal(rate(metric, poor + 0.01).key, 'poor');
    assert.ok(rate(metric, poor + 1).fill < rate(metric, excellent).fill);
  }
});

test('unmeasured or invalid metrics cannot earn a rating', () => {
  assert.equal(rate('download', null), null);
  assert.equal(rate('jitter', NaN), null);
  assert.equal(rate('ping', -1), null);
  assert.equal(rate('unknown', 100), null);
});
