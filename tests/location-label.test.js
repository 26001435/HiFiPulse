const test = require('node:test');
const assert = require('node:assert/strict');
const location = require('../location-label.js');

test('normalizes a reported floor and composes the requested KK12 label', () => {
  assert.equal(location.floor('4'), 'L4');
  assert.equal(location.floor(' l 4 '), 'L4');
  assert.equal(location.label('KK12 (Blok A)', '4'), 'KK12 Blok A L4');
  assert.equal(location.label('KK12 (Blok A)', 'B1'), 'KK12 Blok A B1');
});

test('does not invent a place or a floor when either is missing', () => {
  assert.equal(location.label('KK12 (Blok A)', ''), 'KK12 Blok A · floor not reported');
  assert.equal(location.label('', 'L4'), 'Approximate location · place not reported');
  assert.equal(location.floor(''), '');
});

test('custom names remain self-reported rather than converted to landmarks', () => {
  assert.equal(location.label('Library desk', 'G'), 'Library desk G');
  assert.equal(location.label('Study cube', 'level 4'), 'Study cube level 4');
});
