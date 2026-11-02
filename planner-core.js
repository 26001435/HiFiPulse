/* Simple, evidence-gated task planning; no predictions or hidden AI. */
(function (root) {
  'use strict';
  var stability = typeof module !== 'undefined' && module.exports
    ? require('./stability-core.js') : root.HifiStability;
  var priority = { quiz:4, upload:3, video:2, reading:1 };
  function bestHour(zone, type) {
    var eligible = [];
    for (var h = 0; h < 24; h++) {
      var rows = zone.records.filter(function (r) { return stability.hour(r.timestamp) === h; });
      if (rows.length < 3 || new Set(rows.map(function (r) { return stability.dateKey(r.timestamp); })).size < 2) continue;
      var passed = rows.filter(function (r) {
        return type === 'video'
          ? !r.incomplete && r.download !== null && r.download >= 10 && r.jitter !== null && r.jitter <= 30
          : !r.incomplete && r.upload !== null && r.upload >= 2 && r.ping !== null && r.ping <= 80 &&
            r.jitter !== null && r.jitter <= 15;
      });
      if (passed.length / rows.length < .8) continue;
      eligible.push({ hour:h, count:rows.length,
        jitter:stability.median(passed.map(function (r) { return r.jitter; })) });
    }
    return eligible.sort(function (a,b) { return a.jitter-b.jitter || b.count-a.count || a.hour-b.hour; })[0] || null;
  }
  function plan(tasks, zones) {
    var ordered = tasks.slice().filter(function (t) { return priority[t.type]; })
      .sort(function (a,b) { return priority[b.type]-priority[a.type]; });
    return ordered.map(function (task) {
      if (task.type === 'reading') return {
        task:task, location:'Anywhere once the PDF is saved offline',
        time:'Any convenient time', evidence:'Download the reading before losing connectivity.'
      };
      var matches = zones.filter(function (z) {
        if (task.type === 'video') {
          var usable = z.records.filter(function (r) {
            return !r.incomplete && r.download !== null && r.download >= 10 &&
              r.jitter !== null && r.jitter <= 30;
          });
          return z.count >= 5 && z.days >= 2 && usable.length / z.count >= .8 &&
            z.medianDownload !== null && z.medianDownload >= 10;
        }
        return z.ready;
      });
      var chosen = matches[0];
      if (!chosen) return {
        task:task, location:'No sufficiently tested location yet',
        time:'No evidence-backed hour yet',
        evidence:'Run repeat tests and keep a backup option. This is not a prediction.'
      };
      var hour = bestHour(chosen, task.type);
      return {
        task:task, zone:chosen,
        location:chosen.building + (chosen.floor ? ' · ' + chosen.floor : ' · floor unreported') + ' (self-reported)',
        time:hour ? String(hour.hour).padStart(2,'0') + ':00–' + String(hour.hour).padStart(2,'0') +
          ':59 MYT (historically steadier, not a booking)' : 'No well-supported hour for this spot yet',
        evidence:chosen.count + ' tests over ' + chosen.days + ' days; ' +
          (hour ? hour.count + ' tests across 2+ days in that hour. ' : '') +
          'Retest before any important submission.'
      };
    });
  }
  var api = { plan:plan, bestHour:bestHour };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HifiPlanner = api;
})(typeof window !== 'undefined' ? window : globalThis);
