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
  var providerNames = ["Campus Wi-Fi", "TM", "U Mobile", "CelcomDigi", "Maxis", "Tune Talk", "OneXOX", "REDtone", "Other / unsure"];
  function showProviders() {
    var zone = $("compare-zone").value;
    var period = $("compare-period").value;
    var cutoff = period === "30" ? Date.now() - 30 * 86400000 : null;
    var subset = records.filter(function (r) {
      return measured(r) && inArea(r, zone) && providerNames.includes(r.provider) &&
        (cutoff === null || (r.ts && r.ts >= cutoff && r.ts <= Date.now()));
    });
    $("compare-summary").textContent = subset.length + " labelled measurement(s) in " +
      $("compare-zone").selectedOptions[0].textContent + ". Ranked by median download, not claimed coverage.";
    var host = $("compare-results"); host.replaceChildren();
    var rows = providerNames.map(function (name) {
      var samples = subset.filter(function (r) { return r.provider === name; });
      return {
        name: name, count: samples.length,
        speed: median(samples.map(function (r) { return r.download; })),
        ping: median(samples.filter(function (r) { return r.ping !== null; }).map(function (r) { return r.ping; }))
      };
    }).sort(function (a, b) {
      return Number(b.count >= 3) - Number(a.count >= 3) ||
        (b.speed === null ? -1 : b.speed) - (a.speed === null ? -1 : a.speed);
    });
    rows.forEach(function (r) {
      var card = node("article", "compare-card");
      var label = node("div", "compare-card-header");
      label.appendChild(node("h3", "", r.name));
      label.appendChild(node("span", "compare-count", r.count + " test" + (r.count === 1 ? "" : "s")));
      card.appendChild(label);
      card.appendChild(node("p", "compare-speed", r.speed === null ? "No data yet" : r.speed.toFixed(1) + " Mbps"));
      card.appendChild(node("p", "note", r.count === 0 ? "Run a test on this network to contribute." :
        (r.count < 3 ? "Limited data · not enough for a ranking" : "Median download · " + (r.ping === null ? "ping unavailable" : Math.round(r.ping) + " ms median ping"))));
      if (r.count) {
        var button = node("button", "btn btn-ghost", "See on map →");
        button.type = "button";
        button.addEventListener("click", function () {
          activate("map");
          $("map-provider").value = r.name;
          $("map-provider").dispatchEvent(new Event("change"));
          if (zone !== "all") document.querySelector('[data-zone="' + zone + '"]').click();
        });
        card.appendChild(button);
      }
      host.appendChild(card);
    });
  }
  function activate(name) {
    ["map", "history", "providers"].forEach(function (key) {
      var active = key === name, tab = $("tab-" + key);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      $("panel-" + key).hidden = !active;
    });
    if (name === "map") setTimeout(function () {
      window.dispatchEvent(new Event("hifipulse:map-visible"));
    }, 0);
    if (name === "history") showHistory();
    if (name === "providers") showProviders();
  }
  function activateFromHash() {
    var key = { "#panel-map": "map", "#panel-history": "history", "#panel-providers": "providers" }[window.location.hash];
    if (key) activate(key);
  }
  document.addEventListener("DOMContentLoaded", function () {
    ["map", "history", "providers"].forEach(function (key) {
      $("tab-" + key).addEventListener("click", function () { activate(key); });
      $("tab-" + key).addEventListener("keydown", function (event) {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        var keys = ["map", "history", "providers"];
        var next = keys[(keys.indexOf(key) + (event.key === "ArrowRight" ? 1 : keys.length - 1)) % keys.length];
        activate(next); $("tab-" + next).focus();
      });
    });
    window.addEventListener("hashchange", activateFromHash);
    document.querySelectorAll('#map-menu a[href^="map.html#panel-"]').forEach(function (link) {
      link.addEventListener("click", function () {
        // Also works when the hash is unchanged but a different tab was selected.
        var key = link.hash.replace("#panel-", "");
        if (["map", "history", "providers"].includes(key)) activate(key);
      });
    });
    activateFromHash();
    $("history-zone").addEventListener("change", showHistory);
    $("compare-zone").addEventListener("change", showProviders);
    $("compare-period").addEventListener("change", showProviders);
    window.addEventListener("hifipulse:records", function (event) {
      records = event.detail;
      if (!$("panel-history").hidden) showHistory();
      if (!$("panel-providers").hidden) showProviders();
    });
  });
})();
