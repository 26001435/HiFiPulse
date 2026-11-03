/* Sparse observation cells, not interpolated coverage or verified buildings. */
(function (root) {
  'use strict';
  var STEP = 0.001; // Roughly 110 m north/south near UM; positions are rounded first.
  function eligible(r) {
    // The older receiver rounded BOTH coordinates to two decimals (roughly
    // kilometre-scale placement), even when its Accuracy cell was small.
    // We cannot distinguish those rows from a coincidental modern fix at the
    // same numbers: conservatively keep both cases list-only.
    var legacyRounded = Number.isFinite(r.lat) && Number.isFinite(r.lon) &&
      Math.abs(r.lat * 100 - Math.round(r.lat * 100)) < 1e-7 &&
      Math.abs(r.lon * 100 - Math.round(r.lon * 100)) < 1e-7;
    return Number.isFinite(r.lat) && Number.isFinite(r.lon) && !legacyRounded &&
      Number.isFinite(r.accuracy) && r.accuracy >= 0 && r.accuracy <= 200;
  }
  function cells(records) {
    var groups = new Map();
    records.forEach(function (record) {
      if (!eligible(record)) return;
      var latIndex = Math.floor((record.lat + 1e-9) / STEP);
      var lonIndex = Math.floor((record.lon + 1e-9) / STEP);
      var key = latIndex + ':' + lonIndex;
      if (!groups.has(key)) groups.set(key, {
        key: key, bounds: [[latIndex * STEP, lonIndex * STEP],
          [(latIndex + 1) * STEP, (lonIndex + 1) * STEP]], records: []
      });
      groups.get(key).records.push(record);
    });
    return Array.from(groups.values()).map(function (cell) {
      var speeds = cell.records.map(function (r) { return r.download; })
        .filter(function (n) { return Number.isFinite(n) && n >= 0; })
        .sort(function (a, b) { return a - b; });
      var mid = Math.floor(speeds.length / 2);
      cell.measured = speeds.length;
      cell.incomplete = cell.records.length - speeds.length;
      cell.median = speeds.length ? (speeds[mid] + speeds[(speeds.length - 1) >> 1]) / 2 : null;
      return cell;
    }).sort(function (a, b) { return a.key.localeCompare(b.key); });
  }
  var api = { cells: cells, eligible: eligible, STEP: STEP };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HifiMapGrid = api;
})(typeof window !== 'undefined' ? window : globalThis);
