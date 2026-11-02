/* Observed Campus Wi-Fi stability, not a certification of assessment suitability. */
(function (root) {
  'use strict';
  var location = typeof module !== 'undefined' && module.exports
    ? require('./location-label.js') : root.HifiLocationLabel;
  var clock = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', hourCycle: 'h23'
  });
  function parts(ts) {
    var result = {};
    clock.formatToParts(ts).forEach(function (part) { result[part.type] = part.value; });
    return result;
  }
  function dateKey(ts) { var p = parts(ts); return p.year + '-' + p.month + '-' + p.day; }
  function hour(ts) { return Number(parts(ts).hour); }
  function field(row, names) {
    for (var i = 0; i < names.length; i++) {
      if (row[names[i]] !== undefined && row[names[i]] !== null && row[names[i]] !== '') return row[names[i]];
    }
    var keys = Object.keys(row);
    for (var j = 0; j < keys.length; j++) {
      if (names.some(function (name) { return name.toLowerCase() === keys[j].trim().toLowerCase(); }) && row[keys[j]] !== '') return row[keys[j]];
    }
    return '';
  }
  function number(value) {
    if (value === '' || value === null || value === undefined) return null;
    var cleaned = String(value).replace(/[^\d.eE+\-]/g, '');
    if (!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(cleaned)) return null;
    var n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  function median(values) {
    if (!values.length) return null;
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var i = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[i] : (sorted[i-1] + sorted[i]) / 2;
  }
  function distance(a, b) {
    var north = (a.lat - b.lat) * 111195;
    var east = (a.lon - b.lon) * 111195 * Math.cos(a.lat * Math.PI / 180);
    return Math.hypot(north, east);
  }
  function normalise(row, check, now) {
    now = now === undefined ? Date.now() : now;
    var lat = number(field(row, ['Latitude', 'lat']));
    var lon = number(field(row, ['Longitude', 'lon', 'lng']));
    var accuracy = number(field(row, ['Accuracy', 'accuracy']));
    var timestamp = Date.parse(field(row, ['Timestamp', 'Time', 'Date']));
    var building = String(field(row, ['Building', 'Location'])).trim().slice(0, 60);
    var provider = String(field(row, ['Provider', 'Network Provider', 'Carrier'])).trim();
    if (provider !== 'Campus Wi-Fi' || lat === null || lon === null ||
        lat < 3.11 || lat > 3.14 || lon < 101.64 || lon > 101.68 ||
        accuracy === null || accuracy < 0 || accuracy > 150 || !building ||
        !Number.isFinite(timestamp) || timestamp > now || timestamp < now - 30*86400000) return null;
    if (check && ['mismatch', 'uncertain', 'no-location'].includes(check.check(building, {
      ok: true, lat: lat, lon: lon, accuracy: accuracy
    }))) return null;
    var status = String(field(row, ['Test Status', 'testStatus', 'test_status'])).toLowerCase();
    var download = number(field(row, ['Download', 'Download (Mbps)']));
    var upload = number(field(row, ['Upload', 'Upload (Mbps)']));
    var ping = number(field(row, ['Ping', 'Ping (ms)']));
    var jitter = number(field(row, ['Jitter', 'Jitter (ms)']));
    if (status !== 'incomplete' && (download === null || download < 0)) return null;
    if ([download, upload, ping, jitter].some(function (v) { return v !== null && (v < 0 || v > 10000); })) return null;
    return {
      testId: String(field(row, ['Test ID', 'testId', 'TestId'])), timestamp: timestamp,
      lat: lat, lon: lon, accuracy: accuracy, building: building,
      floor: location.floor(field(row, ['Floor', 'floor'])),
      download: status === 'incomplete' ? null : download,
      upload: upload, ping: ping, jitter: jitter,
      incomplete: status === 'incomplete'
    };
  }
  function dedupe(records) {
    var ids = new Set(), measurements = new Set();
    return records.filter(function (r) {
      var key = [r.timestamp, r.lat, r.lon, r.building.toLowerCase(), r.floor.toLowerCase()].join(':');
      if ((r.testId && ids.has(r.testId)) || measurements.has(key)) return false;
      if (r.testId) ids.add(r.testId);
      measurements.add(key);
      return true;
    });
  }
  function zones(records, now) {
    now = now === undefined ? Date.now() : now;
    var groups = [];
    dedupe(records.filter(function (r) {
      return r.timestamp <= now && r.timestamp >= now - 30*86400000;
    })).sort(function (a,b) { return a.building.localeCompare(b.building) ||
      a.floor.localeCompare(b.floor) || a.lat-b.lat || a.lon-b.lon;
    }).forEach(function (r) {
      var match = groups.find(function (g) {
        return location.label(g.building, '').toLowerCase() === location.label(r.building, '').toLowerCase() &&
          g.floor.toLowerCase() === r.floor.toLowerCase() && distance(g.anchor,r) <= 160;
      });
      if (!match) {
        match = {building:r.building, floor:r.floor, anchor:r, records:[]};
        groups.push(match);
      }
      match.records.push(r);
    });
    return groups.map(function (g) {
      var readings = g.records.filter(function (r) {
        return !r.incomplete && r.upload !== null && r.upload >= 2 &&
          r.ping !== null && r.ping <= 80 && r.jitter !== null && r.jitter <= 15;
      });
      var uploads = g.records.filter(function (r) { return !r.incomplete && r.upload !== null; })
        .map(function (r) { return r.upload; }).sort(function (a,b) { return a-b; });
      var uploadQ1 = uploads.length ? uploads[Math.floor((uploads.length-1)*.25)] : null;
      var pings = g.records.filter(function (r) { return r.ping !== null; }).map(function (r) { return r.ping; });
      var jitters = g.records.filter(function (r) { return r.jitter !== null; }).map(function (r) { return r.jitter; });
      var downloads = g.records.filter(function (r) { return r.download !== null; }).map(function (r) { return r.download; });
      var days = new Set(g.records.map(function (r) { return dateKey(r.timestamp); })).size;
      var count = g.records.length;
      var successRate = readings.length / count;
      var enough = count >= 5 && days >= 2;
      var medianPing = median(pings), medianJitter = median(jitters);
      var ready = enough && successRate >= .8 && uploadQ1 !== null && uploadQ1 >= 2 &&
        medianPing !== null && medianPing <= 80 &&
        medianJitter !== null && medianJitter <= 15;
      // This is an explanatory score, not a probability or a promise of uptime.
      var score = enough && uploadQ1 !== null && medianPing !== null && medianJitter !== null
        ? Math.round(50 * successRate + 25 * Math.max(0, 1 - medianJitter / 30) +
          15 * Math.max(0, 1 - medianPing / 160) + 10 * Math.min(1, uploadQ1 / 5)) : null;
      return {
        building:g.building, floor:g.floor, lat:g.anchor.lat, lon:g.anchor.lon,
        count:count, days:days, success:readings.length, successRate:successRate,
        medianPing:medianPing, medianJitter:medianJitter, score:score,
        lowerUpload:uploadQ1, medianDownload:median(downloads), ready:ready,
        records:g.records
      };
    }).sort(function (a,b) {
      return Number(b.ready)-Number(a.ready) ||
        Number(b.count >= 5 && b.days >= 2)-Number(a.count >= 5 && a.days >= 2) ||
        b.successRate-a.successRate || b.count-a.count ||
        a.building.localeCompare(b.building) || a.floor.localeCompare(b.floor);
    });
  }
  var api = { normalise:normalise, dedupe:dedupe, zones:zones, dateKey:dateKey, hour:hour, median:median };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HifiStability = api;
})(typeof window !== 'undefined' ? window : globalThis);
