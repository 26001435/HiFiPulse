const test = require('node:test');
const assert = require('node:assert/strict');
const feedback = require('../test-feedback.js');
const quality = require('../quality.js');

test('playful responses follow the existing measured quality bands', () => {
  assert.match(feedback.feedback('ping', 20, quality.rate), /slayed/);
  assert.match(feedback.feedback('ping', 75, quality.rate), /Fair enough/);
  assert.match(feedback.feedback('ping', 180, quality.rate), /Ouch/);
  assert.match(feedback.feedback('download', 2, quality.rate), /rough time/);
  assert.equal(feedback.feedback('download', 0, quality.rate), null);
  assert.equal(feedback.feedback('ping', null, quality.rate), null);
});
test('XP counts only valid measurements and never rewards faster numbers', () => {
  assert.equal(feedback.xp({ ping: 12, download: 2, upload: 1, jitter: 20 }), 100);
  assert.equal(feedback.xp({ ping: 220, download: 60, upload: 40, jitter: 2 }), 100);
  assert.equal(feedback.xp({ ping: null, download: 0, upload: null, jitter: null }), 0);
  assert.equal(feedback.xp({ ping: 200, download: null, upload: null, jitter: 30 }), 50);
});
