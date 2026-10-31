/* Conservative plausibility check for the three approximate UM landmark areas.
 * This is NOT address verification: GPS can be spoofed and labels are user-entered.
 */
(function (root) {
  "use strict";
  var centers = {
    pasum: [3.12325, 101.65933],
    kk12: [3.12555, 101.6609],
    kk11: [3.1295, 101.66074]
  };
  function zone(name) {
    var text = String(name || "").toLowerCase();
    if (/\bkk\s*12\b/.test(text)) return "kk12";
    if (/\bkk\s*11\b/.test(text)) return "kk11";
    if (/\bpasum\b/.test(text)) return "pasum";
    return null; // Places without vetted coordinates cannot be geofenced.
  }
  function metres(lat, lon, center) {
    var north = (lat - center[0]) * 111195;
    var east = (lon - center[1]) * 111195 * Math.cos(lat * Math.PI / 180);
    return Math.hypot(north, east);
  }
  function check(name, geo) {
    if (!String(name || "").trim()) return "empty";
    if (!geo || !geo.ok || !Number.isFinite(geo.lat) || !Number.isFinite(geo.lon)) return "no-location";
    if (!Number.isFinite(geo.accuracy) || geo.accuracy > 150) return "uncertain";
    var claimed = zone(name);
    if (!claimed) return "self-reported";
    var own = metres(geo.lat, geo.lon, centers[claimed]);
    if (own > 400) return "mismatch";
    // Two nearby areas overlap. Only reject an obvious mismatch, never claim
    // that proximity proves the selected room, floor, or even building.
    for (var other in centers) {
      if (other !== claimed && metres(geo.lat, geo.lon, centers[other]) + 100 < own)
        return "mismatch";
    }
    return "plausible";
  }
  var api = { check: check, zone: zone };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.HifiPlaceCheck = api;
})(typeof window !== "undefined" ? window : globalThis);
