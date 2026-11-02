const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../stability-core.js');
const check = require('../place-check.js');
const now = Date.parse('2026-11-02T12:00:00+08:00');
function row(i, overrides = {}) {
  return { testId:'test-' + i, timestamp:new Date(now - i*86400000/4).toISOString(),
    latitude:3.12555, longitude:101.6609, accuracy:25,
    building:'KK12 (Blok A)', floor:'L4', provider:'Campus Wi-Fi', testStatus:'complete',
    download:12, upload:4, ping:40, jitter:5, ...overrides };
}
const parse = r => core.normalise(r, check, now);

test('five repeated observations across MYT days establish only an observed candidate', () => {
  const data = Array.from({length:5},(_,i) => parse(row(i)));
  const zone = core.zones(data,now)[0];
  assert.equal(zone.ready,true);
  assert.equal(zone.count,5);
  assert.ok(zone.days >= 2);
  assert.equal(zone.floor,'L4');
  assert.equal(parse(row(8,{floor:'4'})).floor,'L4');
  assert.equal(zone.medianJitter,5);
  assert.ok(zone.score >= 0 && zone.score <= 100);
  assert.equal(core.zones(data.slice(0,2),now)[0].score,null);
  assert.equal(zone.lowerUpload,4);
});

test('failed attempts, weak uploads and missing jitter cannot be silently discarded', () => {
  const good = Array.from({length:4},(_,i) => parse(row(i)));
  const incomplete = parse(row(4,{testStatus:'incomplete',download:null,upload:null,ping:null,jitter:null}));
  assert.equal(core.zones(good.concat(incomplete),now)[0].ready,true); // 4/5 = 80%
  const twoFailures = parse(row(3,{testStatus:'incomplete',download:null,upload:null,ping:null,jitter:null}));
  assert.equal(core.zones(good.slice(0,3).concat(twoFailures,incomplete),now)[0].ready,false);
  assert.equal(core.zones(good.concat(parse(row(4,{upload:null,jitter:null}))),now)[0].ready,true);
  const weak = parse(row(4,{upload:.5}));
  assert.equal(core.zones(good.concat(weak),now)[0].ready,true); // one poor sample is tolerated
  const secondWeak = parse(row(3,{upload:.5}));
  assert.equal(core.zones(good.slice(0,3).concat(secondWeak,weak),now)[0].ready,false);
});

test('separates floors and distant coordinates; rejects bad location, network and future rows', () => {
  const a = parse(row(0));
  const b = parse(row(1,{floor:'L5'}));
  assert.equal(core.zones([a,b],now).length,2);
  assert.equal(parse(row(2,{provider:'Maxis'})),null);
  assert.equal(parse(row(2,{building:'PASUM Main Building'})),null);
  assert.equal(parse(row(2,{accuracy:500})),null);
  assert.equal(parse(row(2,{ping:'Infinity'})).ping,null);
  assert.equal(parse(row(2,{timestamp:new Date(now+1000).toISOString()})),null);
  assert.equal(parse(row(2,{timestamp:new Date(now-31*86400000).toISOString()})),null);
});

test('deduplicates local and remote copies and respects Malaysia date boundary', () => {
  const a = parse(row(0));
  assert.equal(core.dedupe([a,a]).length,1);
  assert.equal(core.dateKey(Date.parse('2026-11-01T16:30:00Z')),'2026-11-02');
  assert.equal(core.hour(Date.parse('2026-11-01T16:30:00Z')),0);
});
