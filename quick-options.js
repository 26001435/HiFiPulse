/* A small, opt-in measurement on secondary pages. Never saves or geolocates. */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    if (!window.HifiPulseEngine || !window.HIFIPULSE) return;
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'quick-trigger';
    trigger.textContent = 'Quick options';
    trigger.setAttribute('aria-controls', 'quick-panel');
    trigger.setAttribute('aria-expanded', 'false');

    var panel = document.createElement('aside');
    panel.id = 'quick-panel';
    panel.className = 'quick-panel';
    panel.setAttribute('aria-label', 'Quick options');
    panel.hidden = true;
    // Only fixed, authored markup. No user or network data is inserted as HTML.
    panel.innerHTML = '<div class="quick-heading"><div><p class="eyebrow">WHILE YOU EXPLORE</p><h2>Quick options</h2></div><button type="button" class="quick-close" aria-label="Close quick options">×</button></div>' +
      '<p class="quick-intro">Check this connection without leaving the page. This reading stays in this panel: no location request, place label or community submission. The test transfers data to Cloudflare.</p>' +
      '<details class="quick-settings"><summary>Test settings</summary><label for="quick-profile">Data use</label><select id="quick-profile"><option value="light">Lightweight · up to ~8 MB</option><option value="heavy">Heavyweight · up to ~52 MB</option></select><p>Use lightweight on metered data. The chosen size is remembered on this device.</p></details>' +
      '<div class="quick-actions"><button type="button" class="btn quick-start">Start quick test</button><button type="button" class="btn btn-ghost quick-cancel" hidden>Cancel</button></div>' +
      '<p class="quick-status" role="status" aria-live="polite">Ready when you are.</p><dl class="quick-results" hidden><div><dt>Download</dt><dd data-metric="download">—</dd></div><div><dt>Upload</dt><dd data-metric="upload">—</dd></div><div><dt>Ping</dt><dd data-metric="ping">—</dd></div><div><dt>Jitter</dt><dd data-metric="jitter">—</dd></div></dl>' +
      '<p class="quick-footnote">Results are not saved. For a map result, choose a network and place in the <a href="index.html">full speed test</a>.</p>' +
      '<section class="quick-trail" aria-labelledby="quick-trail-heading"><p class="eyebrow">EXPLORE AT YOUR PACE</p><h3 id="quick-trail-heading">Campus field trail</h3><p class="quick-trail-progress" aria-live="polite"></p><ol><li data-trail="map"><a href="map.html">Explore the map</a><span>Not yet visited</span></li><li data-trail="guide"><a href="guide.html">Read the Wi-Fi guide</a><span>Not yet visited</span></li><li data-trail="test">Finish a quick reading<span>Not yet measured</span></li></ol><p class="quick-trail-note">A private, browser-session checklist—not a network score or competition. The quick result is never stored.</p></section>';
    document.body.appendChild(trigger);
    document.body.appendChild(panel);

    var profile = panel.querySelector('#quick-profile');
    var start = panel.querySelector('.quick-start');
    var cancel = panel.querySelector('.quick-cancel');
    var status = panel.querySelector('.quick-status');
    var results = panel.querySelector('.quick-results');
    var engine = null;
    var running = false;
    var trailKey = 'hifipulse:field-trail';
    var trail = { map: false, guide: false, test: false };
    try {
      var saved = JSON.parse(sessionStorage.getItem(trailKey) || '{}');
      ['map', 'guide', 'test'].forEach(function (key) { trail[key] = saved[key] === true; });
    } catch (e) { /* Session storage can be disabled. */ }
    function renderTrail() {
      var count = ['map', 'guide', 'test'].filter(function (key) { return trail[key]; }).length;
      panel.querySelector('.quick-trail-progress').textContent = count + ' of 3 explored this session';
      ['map', 'guide', 'test'].forEach(function (key) {
        var item = panel.querySelector('[data-trail="' + key + '"]');
        item.dataset.done = String(trail[key]);
        item.querySelector('span').textContent = trail[key] ? 'Done this session' :
          key === 'test' ? 'Not yet measured' : 'Not yet visited';
      });
    }
    function markTrail(key) {
      trail[key] = true;
      try { sessionStorage.setItem(trailKey, JSON.stringify(trail)); } catch (e) {}
      renderTrail();
    }
    var page = location.pathname.split('/').pop();
    if (page === 'map.html') markTrail('map');
    else if (page === 'guide.html') markTrail('guide');
    else renderTrail();
    try {
      if (localStorage.getItem('hifipulse:quick-profile') === 'heavy') profile.value = 'heavy';
    } catch (e) { /* Private browsing may disallow storage. */ }
    profile.addEventListener('change', function () {
      try { localStorage.setItem('hifipulse:quick-profile', profile.value); } catch (e) {}
    });
    function open() {
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      panel.querySelector('.quick-close').focus();
    }
    function close() {
      if (engine) engine.abort();
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }
    trigger.addEventListener('click', function () { if (panel.hidden) open(); else close(); });
    panel.querySelector('.quick-close').addEventListener('click', close);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !panel.hidden) close();
    });
    window.addEventListener('pagehide', function () { if (engine) engine.abort(); });
    cancel.addEventListener('click', function () { if (engine) engine.abort(); });
    function metric(name, value, unit) {
      panel.querySelector('[data-metric="' + name + '"]').textContent =
        Number.isFinite(value) ? value.toFixed(name === 'ping' || name === 'jitter' ? 0 : 1) + ' ' + unit : '—';
    }
    start.addEventListener('click', async function () {
      if (running) return;
      running = true;
      start.disabled = true;
      profile.disabled = true;
      cancel.hidden = false;
      results.hidden = false;
      ['download', 'upload', 'ping', 'jitter'].forEach(function (name) { metric(name, null, ''); });
      status.textContent = 'Starting quick test…';
      engine = new window.HifiPulseEngine(window.HifiPulseEngine.withProfile(window.HIFIPULSE, profile.value));
      try {
        var reading = await engine.run({
          onPhase: function (phase) {
            var labels = { latency: 'Checking latency…', download: 'Measuring download…', upload: 'Measuring upload…', done: 'Finishing…' };
            status.textContent = labels[phase] || 'Measuring…';
          },
          onProgress: function (p) {
            if (p.phase === 'latency') { metric('ping', p.ping, 'ms'); metric('jitter', p.jitter, 'ms'); }
            if (p.phase === 'download') metric('download', p.mbps, 'Mbps');
            if (p.phase === 'upload') metric('upload', p.mbps, 'Mbps');
          }
        });
        metric('download', reading.download, 'Mbps');
        metric('upload', reading.upload, 'Mbps');
        metric('ping', reading.ping, 'ms');
        metric('jitter', reading.jitter, 'ms');
        status.textContent = reading.download === null
          ? 'Download could not be measured. This attempt is incomplete, not 0 Mbps.'
          : 'Quick reading finished. Nothing was saved or shared.';
        if (Number.isFinite(reading.download)) markTrail('test');
      } catch (err) {
        status.textContent = err && err.name === 'AbortError' ? 'Quick test cancelled. Nothing was saved.' :
          'Could not complete the quick test. Check your connection and try again.';
      } finally {
        engine = null;
        running = false;
        start.disabled = false;
        profile.disabled = false;
        cancel.hidden = true;
      }
    });
  });
})();
