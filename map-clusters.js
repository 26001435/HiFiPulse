/* Group nearby, already-rounded measurements without claiming an exact building. */
(function (root) {
  'use strict';
  function distance(a, b) {
    var north = (a.lat - b.lat) * 111195;
    var east = (a.lon - b.lon) * 111195 * Math.cos(a.lat * Math.PI / 180);
    return Math.hypot(north, east);
  }
  function accurate(r) {
    return Number.isFinite(r.accuracy) && r.accuracy >= 0 && r.accuracy <= 200;
  }
  function group(records, radiusM) {
    // A fixed anchor prevents chaining several neighbouring places together.
    var groups = [];
    records.slice().sort(function (a, b) {
      return a.lat - b.lat || a.lon - b.lon || (a.ts || 0) - (b.ts || 0);
    }).forEach(function (record) {
      var candidate = groups.find(function (g) {
        if (accurate(record) && accurate(g.anchor)) return distance(record, g.anchor) <= radiusM;
        // Legacy rows without an accuracy value may only share an exact
        // already-rounded coordinate. Never fold an imprecise fix into a group.
        return record.accuracy == null && g.anchor.accuracy == null &&
          record.lat === g.anchor.lat && record.lon === g.anchor.lon;
      });
      if (!candidate) {
        candidate = { anchor: record, records: [] };
        groups.push(candidate);
      }
      candidate.records.push(record);
    });
    return groups.map(function (g) {
      return {
        lat: g.records.reduce(function (sum, r) { return sum + r.lat; }, 0) / g.records.length,
        lon: g.records.reduce(function (sum, r) { return sum + r.lon; }, 0) / g.records.length,
        records: g.records
      };
    });
  }
  var api = { group: group, distance: distance };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HifiMapClusters = api;
})(typeof window !== 'undefined' ? window : globalThis);
