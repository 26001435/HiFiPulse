const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../apps-script/Code.gs'), 'utf8');
const oldHeaders = ['Timestamp','Download','Upload','Ping','Jitter','Latitude','Longitude','Accuracy',
  'GeoSource','Building','Floor','Connection','Device','Country','Colo','TestId'];

function runtime(initialRows = [oldHeaders.slice(),['old timestamp',42,9,18,3,3.12,101.66,25,'gps','Old place','2','4g','desktop','MY','SIN','old-id']]) {
  const rows = initialRows.map(row => row.slice());
  let width = Math.max(16, ...rows.map(r => r.length));
  const props = new Map([['SUBMIT_TOKEN','test-client-token']]);
  const cache = new Map();
  const sheet = {
    getLastRow: () => rows.length,
    getLastColumn: () => rows.length ? rows[0].length : 0,
    getMaxColumns: () => width,
    insertColumnsAfter: (at, count) => { assert.equal(at, width); width += count; },
    setFrozenRows: () => {},
    getRange: (row, col, count, length) => {
      assert.equal(row,1); assert.equal(count,1);
      return {
        getValues: () => [Array.from({length},(_,i) => (rows[0] || [])[col-1+i] || '')],
        setValues: values => {
          if (!rows.length) rows.push([]);
          values[0].forEach((value,i) => { rows[0][col-1+i] = value; });
        },
        setFontWeight: () => {}
      };
    },
    appendRow: row => { rows.push(row); }
  };
  const context = {
    SpreadsheetApp:{getActiveSpreadsheet:() => ({getSheets:() => [sheet]})},
    PropertiesService:{getScriptProperties:() => ({
      getProperty:key => props.get(key) || null, setProperty:(key,value) => props.set(key,value)
    })},
    CacheService:{getScriptCache:() => ({
      get:key => cache.get(key) || null, put:(key,value) => cache.set(key,value)
    })},
    LockService:{getScriptLock:() => ({tryLock:() => true, releaseLock:() => {}})},
    ContentService:{MimeType:{JSON:'json'},createTextOutput:text => ({
      setMimeType() { return this; }, getContent() { return text; }
    })},
    Utilities:{getUuid:() => 'fake-uuid'}, Logger:{log:() => {}}, Date, Math, JSON
  };
  vm.createContext(context);
  new vm.Script(source, {filename:'Code.gs'}).runInContext(context);
  const send = overrides => JSON.parse(context.doPost({postData:{contents:JSON.stringify({
    token:'test-client-token',schemaVersion:2,testId:'new-id',
    download:42.5,upload:9,ping:18,jitter:3.2,
    latitude:3.125,longitude:101.661,accuracy:25,geoSource:'gps',
    provider:'Campus Wi-Fi',testStatus:'complete',testProfile:'light',...overrides
  })}}).getContent());
  return {context,rows,send};
}

test('migrates a populated 16-column sheet additively without relabeling historical rows', () => {
  const {rows,send} = runtime();
  const old = rows[1].slice();
  assert.deepEqual(send(), {ok:true});
  assert.equal(rows[0].length,19);
  assert.deepEqual(rows[0].slice(16),['Provider','Test Status','Test Profile']);
  assert.deepEqual(rows[1],old);
  assert.equal(rows[1][16],undefined); // cannot infer provider for old measurements
  assert.equal(rows[2][5],3.125);
  assert.equal(rows[2][6],101.661);
  assert.equal(rows[2][16],'Campus Wi-Fi');
  assert.equal(rows[2][17],'complete');
  assert.deepEqual(send(), {ok:true,duplicate:true});
  assert.equal(rows.length,3);
});

test('rejects missing Provider and preserves unknown pre-existing headers', () => {
  const first = runtime();
  assert.deepEqual(first.send({provider:''}), {ok:false,error:'missing-or-invalid-provider'});
  assert.equal(first.rows.length,2);
  const changed = runtime([oldHeaders.map((v,i) => i === 10 ? 'Some Other Column' : v),['old']]);
  assert.match(changed.send().error,/Unexpected sheet header/);
  assert.equal(changed.rows[0][10],'Some Other Column');
});

test('incomplete GPS attempts can be recorded without inventing a speed', () => {
  const {rows,send} = runtime();
  assert.deepEqual(send({download:null,upload:null,testStatus:'incomplete'}),{ok:true});
  assert.equal(rows[2][1],null);
  assert.equal(rows[2][17],'incomplete');
  const second = runtime();
  assert.deepEqual(second.send({download:null,upload:null,testStatus:'incomplete',latitude:null}),
    {ok:false,error:'incomplete-needs-gps'});
});

test('resumes a partially appended schema without duplicating Provider or changing old data', () => {
  const rows = [oldHeaders.concat(['Provider']), ['old', ...Array(15).fill(''), '']];
  const app = runtime(rows);
  assert.deepEqual(app.send(), {ok:true});
  assert.deepEqual(app.rows[0].slice(16), ['Provider','Test Status','Test Profile']);
  assert.equal(app.rows[1][16], '');
  assert.equal(app.rows[2][16], 'Campus Wi-Fi');
});

test('rejects an inconsistent incomplete status and sanitizes formula-like places', () => {
  const app = runtime();
  assert.deepEqual(app.send({testStatus:'incomplete',download:42}), {ok:false,error:'inconsistent-status'});
  assert.deepEqual(app.send({building:'=IMPORTDATA("https://example.test")'}), {ok:true});
  assert.match(app.rows[2][9], /^'/);
});
