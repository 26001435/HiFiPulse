/* Testable aggregation for the student leaderboard. No identity or fabricated data. */
(function (root) {
  'use strict';
  var formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });
  function parts(timestamp) {
    var out = {};
    formatter.formatToParts(timestamp).forEach(function (item) { out[item.type] = item.value; });
    return out;
  }
  function dateKey(timestamp) {
    var p = parts(timestamp);
    return p.year + '-' + p.month + '-' + p.day;
  }
  function hour(timestamp) { return Number(parts(timestamp).hour); }
  function clock(timestamp) { var p = parts(timestamp); return p.hour + ':' + p.minute + ' MYT'; }
  function field(row, names) {
    for (var i = 0; i < names.length; i++) {
      var v = row[names[i]];
      if (v !== undefined && v !== null && v !== '') return v;
    }
    for (var key in row) {
      if (names.some(function (n) { return n.toLowerCase() === key.toLowerCase().trim(); }) && row[key] !== '') return row[key];
    }
    return '';
  }
  function number(value) {
    if (value === null || value === undefined || value === '') return null;
    var cleaned = String(value).replace(/[^\d.eE+\-]/g, '');
    if (!cleaned || cleaned === '-' || cleaned === '.') return null;
    var n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  function normalise(row, check) {
    var lat = number(field(row, ['Latitude', 'lat']));
    var lon = number(field(row, ['Longitude', 'lon', 'lng']));
    var download = number(field(row, ['Download', 'Download (Mbps)']));
    var timestamp = Date.parse(field(row, ['Timestamp', 'Time', 'Date']));
    // This is a UM pilot. Do not rank tests elsewhere, future tests, or
    // results without a selected campus network and usable coordinates.
    if (lat === null || lon === null || lat < 3.11 || lat > 3.14 || lon < 101.64 || lon > 101.68 ||
        download === null || download < 0 || download > 10000 || !Number.isFinite(timestamp) ||
        timestamp > Date.now() || field(row, ['Provider', 'Network Provider', 'Carrier']) !== 'Campus Wi-Fi') return null;
    var accuracy = number(field(row, ['Accuracy']));
    var building = String(field(row, ['Building', 'Location'])).trim().slice(0, 60);
    if (check && ['mismatch', 'uncertain'].includes(check.check(building, {
      ok: true, lat: lat, lon: lon, accuracy: accuracy
    }))) building = '';
    return { lat: lat, lon: lon, download: download, timestamp: timestamp,
      testId: String(field(row, ['Test ID', 'testId', 'TestId']) || ''),
      building: building, accuracy: accuracy, ping: number(field(row, ['Ping', 'Ping (ms)'])) };
  }
  function dedupe(records) {
    var seenIds = new Set(), seenMeasurements = new Set();
    return records.filter(function (r) {
      var key = [r.timestamp, r.lat, r.lon, r.download].join(':');
      if ((r.testId && seenIds.has(r.testId)) || seenMeasurements.has(key)) return false;
      if (r.testId) seenIds.add(r.testId);
      seenMeasurements.add(key); return true;
    });
  }
  function leaderboard(records, period, now) {
    var today = dateKey(now);
    return records.filter(function (r) {
      return period === 'all' || (period === '7d' ? r.timestamp >= now - 7 * 86400000 : dateKey(r.timestamp) === today);
    }).sort(function (a, b) { return b.download - a.download || b.timestamp - a.timestamp; }).slice(0, 5);
  }
  function hourly(records, now) {
    var groups = Array.from({ length: 24 }, function () { return []; });
    records.forEach(function (r) {
      if (r.timestamp >= now - 30 * 86400000 && r.timestamp <= now) groups[hour(r.timestamp)].push(r.download);
    });
    return groups.map(function (values, h) {
      return { hour: h, count: values.length, average: values.length ? values.reduce(function (a,b) { return a + b; }, 0) / values.length : null };
    });
  }
  var api = { dateKey: dateKey, hour: hour, clock: clock, normalise: normalise,
    dedupe: dedupe, leaderboard: leaderboard, hourly: hourly };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HifiRankingsCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
