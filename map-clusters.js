/* Display-only marker separation. Never change the saved GPS coordinates. */
(function (root) {
  'use strict';
  function layout(records, project) {
    var points = records.map(function (record, index) {
      var p = project(record.lat, record.lon);
      return { record: record, index: index, x: p.x, y: p.y };
    });
    var groups = [];
    points.forEach(function (point) {
      var group = groups.find(function (g) {
        return Math.hypot(point.x - g.x, point.y - g.y) <= 16;
      });
      if (!group) { group = { x: point.x, y: point.y, points: [] }; groups.push(group); }
      group.points.push(point);
    });
    return groups.flatMap(function (group) {
      if (group.points.length === 1) return [{ record: group.points[0].record, x: group.x, y: group.y, displaced: false }];
      return group.points.map(function (point, i) {
        // Bounded rings avoid a single large stack and preserve each test.
        var ring = Math.floor(i / 10), position = i % 10;
        var count = Math.min(10, group.points.length - ring * 10);
        var angle = 2 * Math.PI * position / count - Math.PI / 2;
        var radius = 24 + ring * 18;
        return { record: point.record, x: group.x + Math.cos(angle) * radius,
          y: group.y + Math.sin(angle) * radius, displaced: true };
      });
    });
  }
  var api = { layout: layout };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HifiMapClusters = api;
})(typeof window !== 'undefined' ? window : globalThis);
