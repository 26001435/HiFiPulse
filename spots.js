/* Device-local study suggestions. Never treat a classroom as a study spot. */
(function () {
  "use strict";
  var key = "hifipulse:study-spots";
  var excluded = /\b(tutorial|classroom|lecture|makmal|lab|laboratory|dewan|pensyarah|server|stor|meeting|mesyuarat|bilik tutorial|bilik kuliah)\b/i;
  function eligible(name) { return !!name && !excluded.test(name); }
  function read() {
    try {
      var data = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(data) ? data.filter(function (s) {
        return s && typeof s.name === "string" && eligible(s.name) &&
          typeof s.lat === "number" && typeof s.lon === "number" &&
          s.lat >= 3.11 && s.lat <= 3.14 && s.lon >= 101.64 && s.lon <= 101.68;
      }).slice(0, 100) : [];
    } catch (e) { return []; }
  }
  function add(name, type, lat, lon) {
    name = String(name || "").trim().slice(0, 60);
    if (!eligible(name)) return { ok: false, message: "Classrooms, labs and staff-only rooms cannot be suggested as study spaces." };
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < 3.11 || lat > 3.14 || lon < 101.64 || lon > 101.68)
      return { ok: false, message: "Suggestions must be within the UM campus area." };
    var allowed = ["cafe", "study cube", "bench", "lounge", "library", "other"];
    if (!allowed.includes(type)) type = "other";
    var list = read();
    if (list.some(function (s) { return s.name.toLowerCase() === name.toLowerCase() && Math.abs(s.lat - lat) < .001 && Math.abs(s.lon - lon) < .001; }))
      return { ok: false, message: "This place is already suggested on this device." };
    list.unshift({ name: name, type: type, lat: Number(lat.toFixed(3)), lon: Number(lon.toFixed(3)), added: Date.now() });
    try { localStorage.setItem(key, JSON.stringify(list.slice(0, 100))); }
    catch (e) { return { ok: false, message: "Local storage is unavailable. Could not save suggestion." }; }
    return { ok: true, message: "Saved on this device. Add speed tests here to build a rating." };
  }
  window.HifiSpots = { read: read, add: add, eligible: eligible };
})();
