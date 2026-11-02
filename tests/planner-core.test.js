const test = require('node:test');
const assert = require('node:assert/strict');
const stability = require('../stability-core.js');
const planner = require('../planner-core.js');
const now = Date.parse('2026-11-02T12:00:00+08:00');
const records = [
  0,1,2,3,4,5
].map((i) => ({
  testId:'a'+i, timestamp:now - i*86400000 - i*3600000, lat:3.12555, lon:101.6609,
  building:'KK12 Blok A', floor:'L4', accuracy:25, download:30,
  upload:6, ping:40, jitter:5, incomplete:false
}));
const zone = stability.zones(records,now)[0];

test('sorts quiz and uploads ahead of streaming and offline reading', () => {
  const tasks = [
    {type:'reading',label:'Read PDF'}, {type:'video',label:'Watch lecture'},
    {type:'quiz',label:'Quiz'}, {type:'upload',label:'Upload report'}
  ];
  const output = planner.plan(tasks,[zone]);
  assert.deepEqual(output.map(r => r.task.type),['quiz','upload','video','reading']);
  assert.equal(output[0].zone,zone);
  assert.match(output[0].location,/KK12/);
  assert.match(output[3].location,/Anywhere/);
});

test('never invents a place or hour when history is insufficient', () => {
  const task = {type:'quiz',label:'Quiz'};
  assert.match(planner.plan([task],[])[0].location,/No sufficiently tested/);
  assert.match(planner.plan([task],[zone])[0].time,/No well-supported hour/);
});

test('only suggests an hour with repeat evidence across MYT days', () => {
  const date = Date.parse('2026-11-02T02:00:00Z'); // 10:00 MYT
  const samples = [0,1,2,3,4].map((i) => ({...records[i], timestamp:date-i*86400000}));
  const ready = stability.zones(samples,now)[0];
  assert.equal(planner.bestHour(ready,'quiz').hour,10);
  const response = planner.plan([{type:'quiz',label:'Quiz'}],[ready])[0];
  assert.match(response.time,/10:00–10:59 MYT/);
  const thin = stability.zones(samples.slice(0,2),now)[0];
  assert.equal(planner.bestHour(thin,'quiz'),null);
});
