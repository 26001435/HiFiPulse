const test = require('node:test');
const assert = require('node:assert/strict');

// The browser engine only references window when publishing its constructor.
global.window = global;
require('../engine.js');
const Engine = global.HifiPulseEngine;
const config = {
  endpoints: { download: '/down', upload: '/up', trace: '' },
  test: {
    downloadStreams: 3, downloadChunkBytes: 4 * 1024 * 1024,
    maxDownloadBytes: 40 * 1024 * 1024, downloadWarmupMs: 1000,
    downloadDurationMs: 7000, uploadBytes: 6 * 1024 * 1024,
    uploadRounds: 2, latencySamples: 8
  }
};

test('light and heavy profiles have separate capped budgets without mutating config', () => {
  const light = Engine.withProfile(config, 'light');
  const heavy = Engine.withProfile(config, 'heavy');
  assert.equal(Engine.estimateMegabytes(light), 8);
  assert.equal(Engine.estimateMegabytes(heavy), 52);
  assert.equal(config.test.maxDownloadBytes, 40 * 1024 * 1024);
  assert.equal(light.test.downloadStreams, 1);
  assert.throws(() => Engine.withProfile(config, 'invalid'));
});

test('no download does not invent 0 Mbps and preserves a measured ping', async () => {
  const engine = new Engine(Engine.withProfile(config, 'light'));
  engine._latency = async () => ({ ping: 300, jitter: 40 });
  engine._download = async () => { throw new Error('Download produced no data'); };
  engine._upload = async () => { throw new Error('Upload should not run'); };
  const result = await engine.run();
  assert.equal(result.testStatus, 'incomplete');
  assert.equal(result.download, null);
  assert.equal(result.upload, null);
  assert.equal(result.ping, 300);
});

test('latency failure does not discard a valid download', async () => {
  const engine = new Engine(Engine.withProfile(config, 'light'));
  engine._latency = async () => { throw new Error('Probe timed out'); };
  engine._download = async () => 0.12;
  engine._upload = async () => 0.05;
  const result = await engine.run();
  assert.equal(result.download, 0.12);
  assert.equal(result.ping, null);
  assert.equal(result.testStatus, undefined);
});

test('user cancellation is not recorded as an incomplete attempt', async () => {
  const engine = new Engine(Engine.withProfile(config, 'light'));
  engine._latency = async signal => { engine.abort(); throw new Error('Cancelled'); };
  await assert.rejects(engine.run(), { name: 'AbortError' });
});

test('parallel download streams respect the selected byte budget', async () => {
  const oldFetch = global.fetch;
  const requested = [];
  global.fetch = async url => {
    const bytes = Number(new URL(url, 'https://example.test').searchParams.get('bytes'));
    requested.push(bytes);
    return { ok: true, body: null, arrayBuffer: async () => new ArrayBuffer(bytes) };
  };
  try {
    const engine = new Engine(Engine.withProfile(config, 'heavy'));
    const speed = await engine._download(new AbortController().signal, () => {});
    assert.ok(speed > 0);
    assert.equal(requested.reduce((sum, n) => sum + n, 0), 40 * 1024 * 1024);
  } finally { global.fetch = oldFetch; }
});

test('a stalled upload ends promptly without discarding a valid download', async () => {
  const oldFetch = global.fetch;
  global.fetch = (url, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('Upload timed out')), { once: true });
  });
  try {
    const profile = Engine.withProfile(config, 'light');
    profile.test.uploadTimeoutMs = 20;
    const engine = new Engine(profile);
    engine._latency = async () => ({ ping: 45, jitter: 5 });
    engine._download = async () => 0.3;
    const result = await engine.run();
    assert.equal(result.download, 0.3);
    assert.equal(result.upload, null);
    assert.equal(result.testStatus, undefined);
  } finally { global.fetch = oldFetch; }
});
