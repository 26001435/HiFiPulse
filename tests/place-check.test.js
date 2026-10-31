const test = require('node:test');
const assert = require('node:assert/strict');
const {check, zone} = require('../place-check.js');
const fix = (lat, lon, accuracy = 20) => ({ok: true, lat, lon, accuracy});

test('matches named regions regardless of case', () => {
  assert.equal(zone('Study Cube kk12 (Main)'), 'kk12');
  assert.equal(zone('Kafeteria PASUM'), 'pasum');
  assert.equal(zone('Main Library (Library)'), null);
});
test('keeps plausible labels but does not claim exact building verification', () => {
  assert.equal(check('KK12 (Blok A)', fix(3.12555, 101.6609)), 'plausible');
  assert.equal(check('PASUM Main Building', fix(3.12325, 101.65933)), 'plausible');
});
test('detects obvious cross-area mismatches', () => {
  assert.equal(check('KK11 (Study Cube)', fix(3.12555, 101.6609)), 'mismatch');
  assert.equal(check('PASUM Main Building', fix(3.1295, 101.66074)), 'mismatch');
});
test('does not assign a named place without a trustworthy fix', () => {
  assert.equal(check('KK12 (Blok A)', {ok:false}), 'no-location');
  assert.equal(check('KK12 (Blok A)', fix(3.12555,101.6609, 300)), 'uncertain');
});
test('custom locations remain self-reported even with GPS', () => {
  assert.equal(check('Unknown cafe', fix(3.12555, 101.6609)), 'self-reported');
  assert.equal(check('', fix(3.12555, 101.6609)), 'empty');
});
