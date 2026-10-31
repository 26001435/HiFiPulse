const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../rankings-core.js');
const check = require('../place-check.js');
const now = Date.parse('2026-10-31T12:30:00+08:00');
const row = (timestamp, download, provider = 'Campus Wi-Fi') => ({
  Timestamp: timestamp, Download: download, Provider: provider,
  Latitude: '3.12555', Longitude: '101.6609', Accuracy: 20, Building: 'KK12 (Cafeteria)'
});

test('Malaysia date boundary and time formatting', () => {
  assert.equal(core.dateKey(Date.parse('2026-10-30T16:30:00Z')), '2026-10-31');
  assert.equal(core.hour(Date.parse('2026-10-30T16:30:00Z')), 0);
  assert.equal(core.clock(Date.parse('2026-10-30T16:30:00Z')), '00:30 MYT');
});
test('excludes cellular, missing location and contradictory names', () => {
  const valid = core.normalise(row('2026-10-31T03:00:00Z', '91.5'), check);
  assert.equal(valid.building, 'KK12 (Cafeteria)');
  assert.equal(core.normalise(row('2026-10-31T03:00:00Z', 100, 'Maxis'), check), null);
  assert.equal(core.normalise({...row('2026-10-31T03:00:00Z', 100), Latitude: ''}, check), null);
  assert.equal(core.normalise({...row('2026-10-31T03:00:00Z', 0), 'Test Status': 'incomplete'}, check), null);
  assert.equal(core.normalise({...row('2026-10-31T03:00:00Z', 100), Download: '—'}, check), null);
  const mismatched = core.normalise({...row('2026-10-31T03:00:00Z', 100), Building:'PASUM Main Building'}, check);
  assert.equal(mismatched.building, '');
});
test('top five is descending, date-filtered, de-duplicated and not fabricated', () => {
  const speeds = [25, 60, 15, 80, 40, 70];
  const records = speeds.map((speed, i) => ({
    timestamp: now - i * 1000, lat: 3.125, lon: 101.660, download: speed
  }));
  const unique = core.dedupe(records.concat(records[0]));
  assert.equal(unique.length, 6);
  assert.deepEqual(core.leaderboard(unique, 'today', now).map(r => r.download), [80,70,60,40,25]);
  assert.deepEqual(core.leaderboard([], 'today', now), []);
});
test('hourly means count only observations within the last 30 days', () => {
  const records = [
    {timestamp: now - 1000, download: 20},
    {timestamp: now - 2000, download: 80},
    {timestamp: now - 31 * 86400000, download: 500}
  ];
  const group = core.hourly(records, now)[core.hour(now)];
  assert.equal(group.count, 2);
  assert.equal(group.average, 50);
});
