/* Campus areas are approximate landmarks, not building footprints. */
(function () {
  "use strict";
  var zones = {
    all: { label: "UM focus area", center: [3.126, 101.660], zoom: 16 },
    pasum: { label: "PASUM", center: [3.12325, 101.65933], zoom: 17 },
    kk12: { label: "KK12", center: [3.12555, 101.6609], zoom: 17 },
    kk11: { label: "KK11", center: [3.1295, 101.66074], zoom: 17 }
  };
  window.HifiZones = zones;
  var records = [];
  function $(id) { return document.getElementById(id); }
  function median(values) {
    if (!values.length) return null;
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
  function distance(a, b) {
    var lat = (a[0] - b[0]) * 111195;
    var lng = (a[1] - b[1]) * 111195 * Math.cos(a[0] * Math.PI / 180);
    return Math.hypot(lat, lng);
  }
  function area(rec) {
    var closest = null, best = 260;
    ["pasum", "kk12", "kk11"].forEach(function (key) {
      var d = distance([rec.lat, rec.lon], zones[key].center);
      if (d < best) { best = d; closest = key; }
    });
    return closest;
  }
  function inArea(rec, key) { return key === "all" ? !!area(rec) : area(rec) === key; }
  function measured(rec) { return rec.download !== null && Number.isFinite(rec.download) && rec.download >= 0; }
  function fresh(rec) { return rec.ts && rec.ts >= Date.now() - 30 * 86400000; }
  function node(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function showSpaces() {
    var host = $("spaces-list"); host.replaceChildren();
    ["pasum", "kk12", "kk11"].forEach(function (key) {
      var samples = records.filter(function (r) { return inArea(r, key) && measured(r) && fresh(r); });
      var speeds = samples.map(function (r) { return r.download; });
      var pings = samples.filter(function (r) { return r.ping !== null; }).map(function (r) { return r.ping; });
      var card = node("article", "space-card");
      card.appendChild(node("h3", "", zones[key].label));
      if (samples.length < 3) {
        card.appendChild(node("p", "space-status", "Not enough recent tests"));
        card.appendChild(node("p", "note", samples.length + " of 3 tests needed in the last 30 days."));
      } else {
        var speed = median(speeds), ping = median(pings);
        var rating = speed >= 50 && (ping === null || ping < 60) ? "Good for study & calls" : speed >= 15 ? "Suitable for browsing" : "Connection may be slow";
        card.appendChild(node("p", "space-status", rating));
        card.appendChild(node("p", "space-speed", speed.toFixed(1) + " Mbps median"));
        card.appendChild(node("p", "note", samples.length + " tests in 30 days" + (ping === null ? "" : " · " + Math.round(ping) + " ms median ping")));
      }
      var button = node("button", "btn btn-ghost", "View on map →");
      button.type = "button";
      button.addEventListener("click", function () {
        activate("map");
        document.querySelector('[data-zone="' + key + '"]').click();
      });
      card.appendChild(button); host.appendChild(card);
    });
  }
  function showHistory() {
    var key = $("history-zone").value;
    var groups = new Map();
    records.filter(function (r) { return measured(r) && inArea(r, key) && r.ts && r.ts <= Date.now(); }).forEach(function (r) {
      var day = new Date(r.ts).toISOString().slice(0, 10);
      if (!groups.has(day)) groups.set(day, []);
      groups.get(day).push(r.download);
    });
    var days = Array.from(groups.keys()).sort().slice(-14);
    var chart = $("history-chart"), table = $("history-table");
    chart.replaceChildren(); table.replaceChildren();
    $("history-summary").textContent = days.length ? days.length + " measured day(s) · latest 14 days with data" : "No dated measurements for this area yet. Run a test nearby to start a history.";
    if (!days.length) return;
    var peak = Math.max(50, ...days.map(function (day) { return median(groups.get(day)); }));
    var t = node("table", "history-table");
    var head = node("tr");
    ["Date", "Median download", "Tests"].forEach(function (name) { head.appendChild(node("th", "", name)); });
    t.appendChild(head);
    days.forEach(function (day) {
      var speed = median(groups.get(day));
      var bar = node("div", "history-bar");
      bar.style.height = Math.max(3, speed / peak * 100) + "%";
      bar.title = day + ": " + speed.toFixed(1) + " Mbps from " + groups.get(day).length + " tests";
      bar.setAttribute("aria-label", bar.title);
      chart.appendChild(bar);
      var row = node("tr");
      [day, speed.toFixed(1) + " Mbps", String(groups.get(day).length)].forEach(function (value) { row.appendChild(node("td", "", value)); });
      t.appendChild(row);
    });
    chart.setAttribute("aria-label", "Median download speed for " + days.map(function (day) { return day + " " + median(groups.get(day)).toFixed(1) + " Mbps"; }).join(", "));
    table.appendChild(t);
  }
  function activate(name) {
    ["map", "spaces", "history"].forEach(function (key) {
      var active = name === key, tab = $("tab-" + key);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      $("panel-" + key).hidden = !active;
    });
    if (name === "map") window.dispatchEvent(new Event("hifipulse:map-visible"));
    if (name === "spaces") showSpaces();
    if (name === "history") showHistory();
  }
  document.addEventListener("DOMContentLoaded", function () {
    ["map", "spaces", "history"].forEach(function (key) {
      $("tab-" + key).addEventListener("click", function () { activate(key); });
      $("tab-" + key).addEventListener("keydown", function (event) {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        var keys = ["map", "spaces", "history"];
        var next = keys[(keys.indexOf(key) + (event.key === "ArrowRight" ? 1 : 2)) % 3];
        activate(next); $("tab-" + next).focus();
      });
    });
    $("history-zone").addEventListener("change", showHistory);
    window.addEventListener("hifipulse:records", function (event) {
      records = event.detail;
      if (!$("panel-spaces").hidden) showSpaces();
      if (!$("panel-history").hidden) showHistory();
    });
  });
})();
