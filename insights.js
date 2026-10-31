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
  function spotDistance(rec, spot) { return distance([rec.lat, rec.lon], [spot.lat, spot.lon]); }
  function rankedSpots() {
    var suggestions = window.HifiSpots.read();
    // Discover clearly named public study spaces from the community feed.
    // Arbitrary building labels are NOT automatically treated as study spaces.
    records.forEach(function (r) {
      if (!r.building || !window.HifiSpots.eligible(r.building) || !fresh(r) ||
          (r.accuracy !== null && r.accuracy > 200) || !measured(r)) return;
      var match = r.building.match(/cafe|café|study cube|bench|lounge|library|perpustakaan|kafe/i);
      if (!match) return;
      if (suggestions.some(function (s) {
        return s.name.toLowerCase() === r.building.trim().toLowerCase() && spotDistance(r, s) <= 180;
      })) return;
      suggestions.push({ name: r.building.trim().slice(0, 60), type: match[0].toLowerCase(), lat: r.lat, lon: r.lon });
    });
    return suggestions.map(function (spot) {
      var samples = records.filter(function (r) {
        return measured(r) && fresh(r) && r.ts <= Date.now() &&
          (r.accuracy === null || r.accuracy <= 200) &&
          r.building && r.building.trim().toLowerCase() === spot.name.toLowerCase() &&
          spotDistance(r, spot) <= 180;
      });
      var speeds = samples.map(function (r) { return r.download; }).sort(function (a, b) { return a - b; });
      var days = new Set(samples.map(function (r) { return new Date(r.ts).toISOString().slice(0, 10); }));
      var stable = samples.length >= 3 && days.size >= 2 && speeds[Math.floor((speeds.length - 1) * .25)] >= 25;
      return { spot: spot, samples: samples, speed: median(speeds), stable: stable, ranked: samples.length >= 3 && days.size >= 2 };
    }).sort(function (a, b) {
      return Number(b.stable) - Number(a.stable) || Number(b.ranked) - Number(a.ranked) ||
        (b.speed === null ? -1 : b.speed) - (a.speed === null ? -1 : a.speed) || a.spot.name.localeCompare(b.spot.name);
    });
  }
  function showSpaces() {
    var host = $("spaces-list"); host.replaceChildren();
    var spots = rankedSpots();
    if (!spots.length) host.appendChild(node("p", "empty-spaces", "No suggested study spaces yet. Add a café, study cube, bench or lounge to get started."));
    spots.forEach(function (item, index) {
      var card = node("article", "space-card"), spot = item.spot;
      card.appendChild(node("span", "spot-rank", "#" + (index + 1) + " · " + spot.type));
      card.appendChild(node("h3", "", spot.name));
      card.appendChild(node("p", "space-status", item.stable ? "✦ Consistently good coverage" : item.ranked ? "Measured · variable coverage" : "Awaiting repeat tests"));
      if (item.speed !== null) card.appendChild(node("p", "space-speed", item.speed.toFixed(1) + " Mbps median"));
      card.appendChild(node("p", "note", item.samples.length + " matching tests in 30 days" + (item.ranked ? " · measured across 2+ days" : " · 3 tests across 2 days needed for a rating")));
      var button = node("button", "btn btn-ghost", "View on map →");
      button.type = "button";
      button.addEventListener("click", function () {
        activate("map");
        window.dispatchEvent(new CustomEvent("hifipulse:focus-spot", { detail: spot }));
      });
      card.appendChild(button); host.appendChild(card);
    });
    window.dispatchEvent(new CustomEvent("hifipulse:spots", { detail: spots.filter(function (item) { return item.stable; }).map(function (item) { return item.spot; }) }));
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
  function hourMYT(ts) {
    return Number(new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kuala_Lumpur", hour: "2-digit", hourCycle: "h23"
    }).format(ts));
  }
  function showTime() {
    var chart = $("time-chart"); chart.replaceChildren();
    var buckets = Array.from({ length: 24 }, function () { return []; });
    records.forEach(function (r) {
      if (r.ts && r.ts <= Date.now() && measured(r) && inArea(r, "all")) buckets[hourMYT(r.ts)].push(r.download);
    });
    var peak = Math.max(50, ...buckets.map(function (b) { return median(b) || 0; }));
    buckets.forEach(function (bucket, hour) {
      var bar = node("button", "time-bar");
      bar.type = "button";
      bar.style.setProperty("--bar-height", (bucket.length ? Math.max(4, median(bucket) / peak * 100) : 0) + "%");
      bar.textContent = String(hour).padStart(2, "0");
      bar.title = String(hour).padStart(2, "0") + ":00 MYT: " + (bucket.length ? median(bucket).toFixed(1) + " Mbps median from " + bucket.length + " tests" : "no tests");
      bar.setAttribute("aria-label", bar.title);
      bar.addEventListener("click", function () { $("time-hour").value = String(hour); chooseHour(); });
      chart.appendChild(bar);
    });
    chooseHour();
  }
  function chooseHour() {
    var value = $("time-hour").value;
    var hour = value === "all" ? null : Number(value);
    var matches = records.filter(function (r) {
      return measured(r) && inArea(r, "all") && r.ts && r.ts <= Date.now() && (hour === null || hourMYT(r.ts) === hour);
    });
    $("time-summary").textContent = matches.length + " measured test(s)" + (hour === null ? " across all hours" : " between " + String(hour).padStart(2, "0") + ":00 and " + String((hour + 1) % 24).padStart(2, "0") + ":00 MYT") + ".";
    window.dispatchEvent(new CustomEvent("hifipulse:hour", { detail: hour === null ? -1 : hour }));
  }
  function activate(name) {
    ["map", "spaces", "history", "time"].forEach(function (key) {
      var active = name === key, tab = $("tab-" + key);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      $("panel-" + key).hidden = !active;
    });
    $(name === "time" ? "map-time" : "map-home").appendChild($("map"));
    window.dispatchEvent(new CustomEvent("hifipulse:hour", {
      detail: name === "time" ? ($("time-hour").value === "all" ? -1 : Number($("time-hour").value)) : null
    }));
    if (name === "map" || name === "time") setTimeout(function () {
      window.dispatchEvent(new Event("hifipulse:map-visible"));
    }, 0);
    if (name === "spaces") showSpaces();
    if (name === "history") showHistory();
    if (name === "time") {
      $("range").value = "all";
      showTime();
    }
  }
  document.addEventListener("DOMContentLoaded", function () {
    for (var hour = 0; hour < 24; hour++) {
      var option = node("option", "", String(hour).padStart(2, "0") + ":00 – " + String((hour + 1) % 24).padStart(2, "0") + ":00 MYT");
      option.value = String(hour);
      $("time-hour").appendChild(option);
    }
    $("time-hour").addEventListener("change", chooseHour);
    ["map", "spaces", "history", "time"].forEach(function (key) {
      $("tab-" + key).addEventListener("click", function () { activate(key); });
      $("tab-" + key).addEventListener("keydown", function (event) {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        var keys = ["map", "spaces", "history", "time"];
        var next = keys[(keys.indexOf(key) + (event.key === "ArrowRight" ? 1 : keys.length - 1)) % keys.length];
        activate(next); $("tab-" + next).focus();
      });
    });
    $("history-zone").addEventListener("change", showHistory);
    $("suggest-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var status = $("suggest-status"), name = $("suggest-name").value.trim();
      if (!window.HifiSpots.eligible(name)) {
        status.textContent = "Please choose a non-classroom space, not a lab or staff-only room."; return;
      }
      if (!navigator.geolocation) { status.textContent = "Geolocation is unavailable."; return; }
      status.textContent = "Waiting for location permission…";
      navigator.geolocation.getCurrentPosition(function (pos) {
        if (pos.coords.accuracy > 200) { status.textContent = "Location is too approximate (over 200 m). Try again near the spot."; return; }
        var result = window.HifiSpots.add(name, $("suggest-type").value, pos.coords.latitude, pos.coords.longitude);
        status.textContent = result.message;
        if (result.ok) { $("suggest-form").reset(); showSpaces(); }
      }, function () { status.textContent = "Location unavailable. Allow location access and try again."; },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 });
    });
    window.addEventListener("hifipulse:records", function (event) {
      records = event.detail;
      showSpaces();
      if (!$("panel-history").hidden) showHistory();
      if (!$("panel-time").hidden) showTime();
    });
  });
})();
