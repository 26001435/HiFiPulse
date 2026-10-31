/* Rankings page: real Campus Wi-Fi observations only; no student identity. */
(function () {
  'use strict';
  var core = window.HifiRankingsCore;
  var records = [];
  function $(id) { return document.getElementById(id); }
  function node(tag, cls, text) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function median(values) {
    if (!values.length) return null;
    var sorted = values.slice().sort(function (a,b) { return a - b; });
    var mid = sorted.length >> 1;
    return sorted.length % 2 ? sorted[mid] : (sorted[mid-1] + sorted[mid]) / 2;
  }
  function distance(a, b) {
    var north = (a.lat - b.lat) * 111195;
    var east = (a.lon - b.lon) * 111195 * Math.cos(a.lat * Math.PI / 180);
    return Math.hypot(north, east);
  }
  function place(r) { return r.building || 'Approximate campus location (name unavailable)'; }
  function localRecords() {
    try {
      var data = JSON.parse(localStorage.getItem('hifipulse:results') || '[]');
      return Array.isArray(data) ? data.map(function (r) {
        return core.normalise(r, window.HifiPlaceCheck);
      }).filter(Boolean) : [];
    } catch (e) { return []; }
  }
  function renderLeaderboard() {
    var now = Date.now();
    var today = core.dateKey(now);
    var todayRecords = records.filter(function (r) { return core.dateKey(r.timestamp) === today; });
    var best = core.leaderboard(records, 'today', now)[0];
    $('daily-speed').textContent = best ? best.download.toFixed(1) + ' Mbps' : '—';
    $('daily-detail').textContent = best ? place(best) + ' · ' + core.clock(best.timestamp) : 'No Campus Wi-Fi tests recorded today.';
    $('daily-count').textContent = String(todayRecords.length);
    var top = core.leaderboard(records, $('rank-period').value, now);
    var list = $('top-five'); list.replaceChildren();
    if (!top.length) {
      list.appendChild(node('li','rank-empty','No qualifying Campus Wi-Fi results for this period. Try another period or run a test.'));
      return;
    }
    top.forEach(function (r, i) {
      var item = node('li','ranking-entry');
      item.appendChild(node('span','rank-number',String(i+1).padStart(2,'0')));
      var details = node('div','ranking-entry-detail');
      details.appendChild(node('strong','',place(r)));
      details.appendChild(node('span','',new Date(r.timestamp).toLocaleDateString('en-MY', { timeZone:'Asia/Kuala_Lumpur', day:'numeric', month:'short', year:'numeric' }) + ' · ' + core.clock(r.timestamp) + (r.ping === null ? '' : ' · ' + Math.round(r.ping) + ' ms ping')));
      item.appendChild(details);
      item.appendChild(node('strong','rank-speed',r.download.toFixed(1) + ' Mbps'));
      list.appendChild(item);
    });
  }
  function renderHours() {
    var hours = core.hourly(records, Date.now());
    var eligible = hours.filter(function (h) { return h.count >= 3; }).sort(function (a,b) { return b.average-a.average || b.count-a.count; });
    var best = eligible[0];
    $('best-hour').textContent = best ? String(best.hour).padStart(2,'0') + ':00' : '—';
    $('best-hour-detail').textContent = best ? best.average.toFixed(1) + ' Mbps average · ' + best.count + ' tests in 30 days (MYT)' : 'No hour has at least 3 measurements yet.';
    var host = $('hourly-results'); host.replaceChildren();
    hours.forEach(function (h) {
      var row = node('div','hour-row');
      row.appendChild(node('span','hour-label',String(h.hour).padStart(2,'0') + ':00'));
      var track = node('span','hour-track');
      var bar = node('span','hour-fill');
      bar.style.width = h.average === null ? '0%' : Math.max(2, Math.min(100, h.average / Math.max(50, ...hours.map(function (v) { return v.average || 0; })) * 100)) + '%';
      track.appendChild(bar); row.appendChild(track);
      row.appendChild(node('span','hour-figure',h.count ? h.average.toFixed(1) + ' Mbps · ' + h.count : 'No tests'));
      host.appendChild(row);
    });
  }
  function candidates() {
    var suggestions = window.HifiSpots.read().map(function (s) { return {
      name:s.name, type:s.type, lat:s.lat, lon:s.lon
    }; });
    records.forEach(function (r) {
      if (!r.building || !window.HifiSpots.eligible(r.building) ||
          r.accuracy === null || r.accuracy > 150 ||
          !/cafe|café|kafe|study cube|bench|lounge|library|perpustakaan/i.test(r.building)) return;
      if (suggestions.some(function (s) { return s.name.toLowerCase() === r.building.toLowerCase() && distance(s,r) <= 180; })) return;
      suggestions.push({name:r.building, type:'Suggested study area', lat:r.lat, lon:r.lon});
    });
    return suggestions.map(function (spot) {
      var recent = records.filter(function (r) {
        return r.building && r.building.toLowerCase() === spot.name.toLowerCase() &&
          r.accuracy !== null && r.accuracy <= 150 &&
          r.timestamp >= Date.now() - 30*86400000 && distance(r,spot) <= 180;
      });
      var speeds = recent.map(function (r) { return r.download; }).sort(function (a,b) { return a-b; });
      var days = new Set(recent.map(function (r) { return core.dateKey(r.timestamp); }));
      var ranked = recent.length >= 3 && days.size >= 2;
      return {spot:spot, count:recent.length, median:median(speeds), ranked:ranked,
        strong:ranked && speeds[Math.floor((speeds.length - 1)*.25)] >= 25};
    }).sort(function (a,b) {
      return Number(b.strong)-Number(a.strong) || Number(b.ranked)-Number(a.ranked) ||
        (b.median === null ? -1 : b.median)-(a.median === null ? -1 : a.median) || a.spot.name.localeCompare(b.spot.name);
    });
  }
  function renderSpaces() {
    var host = $('ranked-spaces'); host.replaceChildren();
    var ranked = candidates();
    if (!ranked.length) { host.appendChild(node('p','empty-spaces','No study spaces suggested yet. Add a café, study cube, bench or lounge to start collecting evidence.')); return; }
    ranked.forEach(function (r,i) {
      var card = node('article','space-card');
      card.appendChild(node('span','spot-rank','#' + (i+1) + ' · ' + r.spot.type));
      card.appendChild(node('h3','',r.spot.name));
      card.appendChild(node('p','space-status',r.strong ? 'Consistently good coverage' : r.ranked ? 'Measured · variable coverage' : 'Awaiting repeat tests'));
      if (r.median !== null) card.appendChild(node('p','space-speed',r.median.toFixed(1) + ' Mbps median'));
      card.appendChild(node('p','note',r.count + ' matching Campus Wi-Fi test' + (r.count === 1 ? '' : 's') + ' in 30 days' + (r.ranked ? ' · across 2+ days' : ' · 3 tests across 2 days needed')));
      var link = node('a','space-map-link','View map →');
      link.href = 'map.html?lat=' + encodeURIComponent(r.spot.lat) + '&lon=' + encodeURIComponent(r.spot.lon);
      card.appendChild(link); host.appendChild(card);
    });
  }
  function render() { renderLeaderboard(); renderHours(); renderSpaces(); }
  async function load() {
    var refresh = $('rank-refresh'); refresh.disabled = true;
    $('rank-status').textContent = 'Loading measurements…';
    var local = localRecords();
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 12000);
    try {
      var response = await fetch(window.HIFIPULSE.sheetCsvUrl, { cache:'no-store', signal: controller.signal });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      var text = await response.text();
      if (/^\s*</.test(text)) throw new Error('Expected published CSV, received a web page');
      var rows = window.HifiCsv.toObjects(window.HifiCsv.parse(text));
      var remote = rows.map(function (r) { return core.normalise(r,window.HifiPlaceCheck); }).filter(Boolean);
      records = core.dedupe(remote.concat(local));
      $('rank-status').textContent = remote.length + ' community Campus Wi-Fi tests loaded' + (local.length ? ' · ' + local.length + ' saved here' : '') + '. Updated ' + new Date().toLocaleTimeString() + '.';
    } catch (error) {
      records = core.dedupe(local);
      $('rank-status').textContent = local.length ? 'Community feed unavailable; showing tests saved on this device only.' : 'Community feed unavailable. No local Campus Wi-Fi results to show.';
    } finally { clearTimeout(timeout); render(); refresh.disabled = false; }
  }
  document.addEventListener('DOMContentLoaded', function () {
    $('rank-period').addEventListener('change', renderLeaderboard);
    $('rank-refresh').addEventListener('click', load);
    $('suggest-form').addEventListener('submit', function (event) {
      event.preventDefault();
      var status = $('suggest-status');
      var name = $('suggest-name').value.trim();
      if (!window.HifiSpots.eligible(name)) { status.textContent = 'Choose a non-classroom space, not a lab or staff-only room.'; return; }
      if (!navigator.geolocation) { status.textContent = 'Location is unavailable.'; return; }
      status.textContent = 'Waiting for location permission…';
      navigator.geolocation.getCurrentPosition(function (pos) {
        if (pos.coords.accuracy > 150) { status.textContent = 'Location is too approximate (over 150 m). Try near the spot.'; return; }
        var result = window.HifiSpots.add(name, $('suggest-type').value, pos.coords.latitude, pos.coords.longitude);
        status.textContent = result.message;
        if (result.ok) { $('suggest-form').reset(); renderSpaces(); }
      }, function () { status.textContent = 'Location unavailable. Allow access and try again.'; },
      {enableHighAccuracy:true, timeout:10000, maximumAge:300000});
    });
    load();
    setInterval(function () { if (!document.hidden) load(); }, 60000);
  });
})();
