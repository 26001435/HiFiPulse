/* Explain which published CSV fields the shared rankings actually need. */
(function (root) {
  'use strict';
  function analyse(headers, rows, normalise) {
    var columns = (headers || []).map(function (h) { return String(h).trim().toLowerCase(); });
    function has(names) { return names.some(function (n) { return columns.includes(n.toLowerCase()); }); }
    var missing = [];
    if (!has(['Provider', 'Network Provider', 'Carrier'])) missing.push('Provider');
    if (!has(['Download', 'Download (Mbps)'])) missing.push('Download');
    if (!has(['Timestamp', 'Time', 'Date'])) missing.push('Timestamp');
    if (!has(['Latitude', 'lat']) || !has(['Longitude', 'lon', 'lng'])) missing.push('Latitude / Longitude');
    var count = rows.length;
    var wifi = rows.filter(function (row) {
      return Object.keys(row).some(function (key) {
        return ['provider','network provider','carrier'].includes(key.trim().toLowerCase()) &&
          String(row[key]).trim() === 'Campus Wi-Fi';
      });
    }).length;
    var eligible = rows.filter(function (row) { return !!normalise(row); }).length;
    var message;
    if (missing.length) message = 'Published CSV is missing ' + missing.join(', ') + '. Update the external writer and republish the correct sheet/tab as CSV.';
    else if (!count) message = 'Published CSV contains no measurements yet. A result on this device does not prove it reached the community sheet.';
    else if (!wifi) message = count + ' published row(s), but none labelled Campus Wi-Fi. Check that the external writer stores the Provider field.';
    else if (!eligible) message = wifi + ' Campus Wi-Fi row(s), but none qualify: check timestamps, positive/zero measured download, rounded campus GPS coordinates and Test Status. Incomplete attempts do not enter the speed leaderboard.';
    else message = eligible + ' eligible community test(s) available across devices. The Today filter uses Malaysia time; choose All time to see older results.';
    return { count: count, wifi: wifi, eligible: eligible, missing: missing, message: message };
  }
  var api = { analyse: analyse };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HifiFeedDiagnostics = api;
})(typeof window !== 'undefined' ? window : globalThis);
