/* ============================================================================
 * HiFiPulse — live coverage map.
 * Reads the published sheet CSV, renders tier-coloured markers, and keeps
 * every user-supplied value out of innerHTML.
 * ==========================================================================*/
(function () {
  "use strict";

  var cfg = window.HIFIPULSE;
  var TIERS = cfg.map.tiers;

  function $(id) {
    return document.getElementById(id);
  }

  var map = L.map("map", { preferCanvas: true, worldCopyJump: true }).setView(
    cfg.map.center,
    cfg.map.zoom
  );

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  var layer = L.layerGroup().addTo(map);
  var deadZoneLayer = L.layerGroup().addTo(map);
  var assessmentLayer = L.layerGroup().addTo(map);
  var deadZoneKey = "hifipulse:dead-zones";
  var deadZoneReports = [];
  var records = [];
  var assessmentRecords = [];
  var sidebarRecords = [];
  var mapPointers = new Map();
  var sidebarLimit = 40;
  var fitted = false;
  var lastLoaded = null;

  function readDeadZones() {
    try {
      var list = JSON.parse(localStorage.getItem(deadZoneKey) || "[]");
      return Array.isArray(list) ? list.filter(function (r) {
        return r && typeof r.id === "string" && typeof r.lat === "number" &&
          typeof r.lon === "number" && r.lat >= 3.11 && r.lat <= 3.14 &&
          r.lon >= 101.64 && r.lon <= 101.68 && typeof r.provider === "string" &&
          typeof r.issue === "string" && typeof r.ts === "number";
      }).slice(0, 50) : [];
    } catch (e) { return []; }
  }

  function saveDeadZones() {
    try {
      localStorage.setItem(deadZoneKey, JSON.stringify(deadZoneReports));
      return true;
    } catch (e) { return false; }
  }

  function drawDeadZones() {
    deadZoneLayer.clearLayers();
    if (!$("show-dead-zones").checked) return;
    var selected = $("map-provider").value;
    deadZoneReports.forEach(function (r) {
      if (selected !== "all" && selected !== r.provider) return;
      var marker = L.circleMarker([r.lat, r.lon], {
        radius: 15, color: "#c84252", weight: 3, fillColor: "#fc5a68",
        fillOpacity: .14, dashArray: "5 4"
      });
      var popup = document.createElement("div");
      var title = document.createElement("strong");
      title.textContent = "⚠ Reported dead zone (unverified)";
      popup.appendChild(title);
      [r.provider + " · " + r.issue, r.place || "Approximate location",
        new Date(r.ts).toLocaleString() + " · saved on this device"].forEach(function (text) {
        var line = document.createElement("p"); line.textContent = text; popup.appendChild(line);
      });
      marker.bindPopup(popup).addTo(deadZoneLayer);
    });
  }

  function renderDeadZoneList() {
    var host = $("dead-zone-list"); host.replaceChildren();
    if (!deadZoneReports.length) return;
    var title = document.createElement("h3"); title.textContent = "Your reports";
    host.appendChild(title);
    deadZoneReports.forEach(function (r) {
      var row = document.createElement("div"); row.className = "dead-zone-row";
      var text = document.createElement("span");
      text.textContent = r.provider + " · " + r.issue + (r.place ? " · " + r.place : "") +
        " · " + new Date(r.ts).toLocaleDateString();
      var remove = document.createElement("button"); remove.type = "button";
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", "Remove dead zone report for " + r.provider + " " + r.place);
      remove.addEventListener("click", function () {
        var previous = deadZoneReports;
        deadZoneReports = deadZoneReports.filter(function (item) { return item.id !== r.id; });
        if (!saveDeadZones()) { deadZoneReports = previous; $("dead-zone-status").textContent = "Could not remove report: storage unavailable."; return; }
        renderDeadZoneList(); drawDeadZones();
      });
      row.appendChild(text); row.appendChild(remove); host.appendChild(row);
    });
  }

  /* ---- Column resolution -------------------------------------------------
   * The sheet has been through a couple of header conventions
   * ("Download" vs "Download (Mbps)"). Resolve by name, case-insensitively,
   * so old and new rows both work. --------------------------------------*/
  function field(row, names) {
    var i;
    for (i = 0; i < names.length; i++) {
      var v = row[names[i]];
      if (v !== undefined && v !== "") return v;
    }
    for (var key in row) {
      var lower = key.toLowerCase().trim();
      for (i = 0; i < names.length; i++) {
        if (lower === names[i].toLowerCase()) {
          var value = row[key];
          if (value !== undefined && value !== "") return value;
        }
      }
    }
    return "";
  }

  function num(value) {
    if (value === "" || value === null || value === undefined) return null;
    var n = Number(String(value).replace(/[^\d.eE+-]/g, ""));
    return isFinite(n) ? n : null;
  }

  function parseTs(value) {
    if (!value) return null;
    var t = Date.parse(value);
    if (isFinite(t)) return t;
    var m = String(value).match(
      /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/
    );
    if (m) {
      return new Date(
        +m[1],
        +m[2] - 1,
        +m[3],
        +m[4],
        +m[5],
        +(m[6] || 0)
      ).getTime();
    }
    return null;
  }

  function tierFor(mbps) {
    for (var i = 0; i < TIERS.length; i++) {
      if (mbps >= TIERS[i].min) return TIERS[i];
    }
    return TIERS[TIERS.length - 1];
  }

  function fmt(value, decimals) {
    return value === null || value === undefined
      ? "—"
      : value.toFixed(decimals === undefined ? 1 : decimals);
  }

  function fmtSpeed(value) {
    if (value === null) return "—";
    return value > 0 && value < 0.01 ? value.toFixed(6) :
      value < 1 ? value.toFixed(4) : value.toFixed(1);
  }

  /* ---- Normalisation ----------------------------------------------------- */
  function normalise(row) {
    var lat = num(field(row, ["Latitude", "lat"]));
    var lon = num(field(row, ["Longitude", "lon", "lng", "Long"]));
    if (lat === null || lon === null) return null;
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;

    var incomplete = field(row, ["Test Status", "testStatus", "test_status"]) === "incomplete";
    var download = incomplete ? null : num(field(row, ["Download", "Download (Mbps)"]));
    if (download === null && !incomplete) return null;
    var accuracy = num(field(row, ["Accuracy", "accuracy"]));

    var building = field(row, ["Building", "Location"]);
    var verdict = window.HifiPlaceCheck.check(building, {
      ok: true, lat: lat, lon: lon, accuracy: accuracy
    });
    // Legacy sheet rows can also contain contradictory names. Never show or
    // rank an obviously wrong label, even if it predates the browser check.
    if (verdict === "mismatch" || verdict === "uncertain") building = "";
    return {
      lat: lat,
      lon: lon,
      testId: field(row, ["TestId", "Test ID", "testId"]),
      download: download,
      testStatus: incomplete && download === null ? "incomplete" : "complete",
      upload: num(field(row, ["Upload", "Upload (Mbps)"])),
      ping: num(field(row, ["Ping", "Ping (ms)"])),
      jitter: num(field(row, ["Jitter", "Jitter (ms)"])),
      accuracy: accuracy,
      building: building,
      floor: building ? window.HifiLocationLabel.floor(field(row, ["Floor"])) : "",
      connection: field(row, ["Connection"]),
      provider: field(row, ["Provider", "Network Provider", "Carrier"]),
      city: field(row, ["City"]),
      country: field(row, ["Country"]),
      ts: parseTs(field(row, ["Timestamp", "Time", "Date"]))
    };
  }

  /* ---- Popup ------------------------------------------------------------- */
  function popupRow(label, value) {
    var el = document.createElement("div");
    el.className = "popup-row";
    var k = document.createElement("span");
    k.textContent = label;
    var v = document.createElement("b");
    v.textContent = value;
    el.appendChild(k);
    el.appendChild(v);
    return el;
  }

  function buildPopup(rec, tier) {
    var el = document.createElement("div");

    var head = document.createElement("div");
    head.className = "popup-head";
    var speed = document.createElement("span");
    speed.className = "popup-speed";
    speed.style.color = tier.color;
    speed.textContent = rec.testStatus === "incomplete" ? "—" : fmtSpeed(rec.download);
    var unit = document.createElement("span");
    unit.className = "popup-unit";
    unit.textContent = rec.testStatus === "incomplete" ? "Download unmeasured · incomplete attempt" : "Mbps download";
    head.appendChild(speed);
    head.appendChild(unit);
    el.appendChild(head);

    el.appendChild(popupRow("Upload", fmt(rec.upload, 1) + " Mbps"));
    el.appendChild(popupRow("Ping", fmt(rec.ping, 0) + " ms"));
    if (rec.jitter !== null) {
      el.appendChild(popupRow("Jitter", fmt(rec.jitter, 1) + " ms"));
    }
    if (rec.building) {
      el.appendChild(
        popupRow(
          "Place (self-reported)",
          window.HifiLocationLabel.label(rec.building, rec.floor)
        )
      );
    }
    if (rec.connection) {
      el.appendChild(popupRow("Link", rec.connection));
    }
    if (rec.provider) el.appendChild(popupRow("Network", rec.provider));

    var time = document.createElement("div");
    time.className = "popup-time";
    time.textContent = rec.ts
      ? new Date(rec.ts).toLocaleString()
      : "Time unknown";
    if (rec.accuracy !== null && rec.accuracy > cfg.map.preciseAccuracyM) {
      time.textContent += " · approximate position";
    }
    el.appendChild(time);

    return el;
  }

  function sidebarLine(host, text, className) {
    var span = document.createElement("span");
    if (className) span.className = className;
    span.textContent = text;
    host.appendChild(span);
  }
  function renderSidebar() {
    var query = $("test-search").value.trim().toLocaleLowerCase();
    var matches = sidebarRecords.filter(function (r) {
      return !query || [r.building, r.floor, r.provider,
        window.HifiLocationLabel.label(r.building, r.floor)].join(" ").toLocaleLowerCase().includes(query);
    });
    var list = $("test-list");
    list.replaceChildren();
    $("test-list-status").textContent = matches.length + " of " + sidebarRecords.length +
      " visible test" + (sidebarRecords.length === 1 ? "" : "s") +
      (query ? " matching this search." : " after map filters.");
    matches.slice(0, sidebarLimit).forEach(function (r) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "test-list-item";
      var title = document.createElement("strong");
      title.textContent = window.HifiLocationLabel.label(r.building, r.floor);
      button.appendChild(title);
      sidebarLine(button, (r.provider || "Network unlabelled") + " · " +
        (r.ts ? new Date(r.ts).toLocaleString() : "Time unknown"));
      sidebarLine(button, r.download === null ? "Download unmeasured · incomplete attempt" :
        "Download " + fmtSpeed(r.download) + " Mbps",
        "test-list-speed");
      if (r.download === null) button.querySelector(".test-list-speed").dataset.tone = "unknown";
      sidebarLine(button, "Upload " + fmt(r.upload, 1) + " Mbps · Ping " +
        fmt(r.ping, 0) + " ms · Jitter " + fmt(r.jitter, 1) + " ms");
      sidebarLine(button, r.accuracy === null ? "GPS precision unavailable · rounded position" :
        "GPS ±" + Math.round(r.accuracy) + " m · rounded position");
      button.addEventListener("click", function () {
        var entry = mapPointers.get(r);
        if (!entry) return;
        list.querySelectorAll("[data-active]").forEach(function (item) { delete item.dataset.active; });
        button.dataset.active = "true";
        var targetZoom = Math.max(map.getZoom(), 17);
        if (targetZoom !== map.getZoom()) {
          map.once("zoomend", function () {
            var current = mapPointers.get(r);
            if (current) current.marker.openPopup();
          });
          map.setView([r.lat, r.lon], targetZoom);
        } else {
          map.panTo([r.lat, r.lon]);
          entry.marker.openPopup();
        }
        if (window.matchMedia && window.matchMedia("(max-width: 950px)").matches) {
          $("map-home").scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
        }
      });
      list.appendChild(button);
    });
    var more = $("test-list-more");
    more.hidden = matches.length <= sidebarLimit;
    if (!more.hidden) more.textContent = "Show more tests (" + (matches.length - sidebarLimit) + " remaining)";
  }

  function drawAssessmentZones() {
    assessmentLayer.clearLayers();
    var enabled = $("show-assessment").checked;
    var provider = $("map-provider").value;
    if (!enabled || (provider !== "all" && provider !== "Campus Wi-Fi")) return;
    window.HifiStability.zones(assessmentRecords, Date.now()).filter(function (z) {
      return z.ready;
    }).forEach(function (z) {
      var marker = L.circleMarker([z.lat, z.lon], {
        radius: 23, color: "#255d49", weight: 3, dashArray: "6 4", fillOpacity: 0
      });
      var popup = document.createElement("div");
      var heading = document.createElement("strong");
      heading.textContent = "Assessment-ready candidate · observed only";
      popup.appendChild(heading);
      popup.appendChild(popupRow("Self-reported place", window.HifiLocationLabel.label(z.building, z.floor)));
      popup.appendChild(popupRow("Evidence", z.success + "/" + z.count + " attempts passed over " + z.days + " days"));
      popup.appendChild(popupRow("Median jitter", z.medianJitter.toFixed(1) + " ms"));
      var caveat = document.createElement("p");
      caveat.textContent = "Past 30 days; may include tests saved only on this device. Does not verify a room or monitor continuous dropouts. Retest before an assessment.";
      popup.appendChild(caveat);
      marker.bindPopup(popup, { maxWidth: 300 }).addTo(assessmentLayer);
    });
  }

  /* ---- Rendering --------------------------------------------------------- */
  function activeTiers() {
    var out = {};
    TIERS.forEach(function (tier) {
      var input = document.querySelector('.chip input[value="' + tier.id + '"]');
      out[tier.id] = !input || input.checked;
    });
    out.incomplete = $("show-incomplete").checked;
    return out;
  }

  function render() {
    layer.clearLayers();
    mapPointers.clear();
    drawDeadZones();

    var enabled = activeTiers();
    var range = $("range").value;
    var providerFilter = $("map-provider").value;
    var cutoff =
      range === "24h"
        ? Date.now() - 86400000
        : range === "7d"
        ? Date.now() - 7 * 86400000
        : null;

    var shown = 0;
    var totalDownload = 0;
    var downloadCount = 0;
    var pings = [];
    var counts = { fast: 0, ok: 0, slow: 0, incomplete: 0 };
    var bounds = [];

    var filtered = records.filter(function (rec) {
      if (providerFilter !== "all" && rec.provider !== providerFilter) return false;
      if (cutoff !== null && rec.ts !== null && rec.ts < cutoff) return false;
      var tier = rec.download === null ? "incomplete" : tierFor(rec.download).id;
      return enabled[tier];
    });
    filtered.forEach(function (rec) {
      counts[rec.download === null ? "incomplete" : tierFor(rec.download).id] += 1;
      shown += 1;
      if (rec.download !== null) { totalDownload += rec.download; downloadCount += 1; }
      if (rec.ping !== null) pings.push(rec.ping);
    });

    sidebarRecords = filtered.slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    sidebarLimit = 40;
    // Separate overlapping markers in screen space, not geographical space.
    // Lines point back to the original recorded fix; no position is averaged.
    var placements = window.HifiMapClusters.layout(filtered, function (lat, lon) {
      return map.latLngToLayerPoint([lat, lon]);
    });
    placements.forEach(function (placement) {
      var rec = placement.record;
      var tier = rec.download === null ? { color: "#71807a" } : tierFor(rec.download);
      var approximate = rec.accuracy === null || rec.accuracy > cfg.map.preciseAccuracyM;
      var position = map.layerPointToLatLng(L.point(placement.x, placement.y));
      if (placement.displaced) {
        L.polyline([[rec.lat, rec.lon], position], {
          color: "#71807a", weight: 1, opacity: 0.55, interactive: false
        }).addTo(layer);
      }
      var marker = L.circleMarker(position, {
        radius: 7, color: "#ffffff", weight: 1.5, fillColor: tier.color,
        dashArray: rec.download === null ? "3 3" : null,
        fillOpacity: approximate || rec.download === null ? 0.35 : 0.9
      });
      marker.bindPopup(buildPopup(rec, tier), { maxWidth: 320 });
      marker.addTo(layer);
      mapPointers.set(rec, { group: { lat: rec.lat, lon: rec.lon }, marker: marker });
      bounds.push([rec.lat, rec.lon]);
    });

    if (!fitted && bounds.length) {
      // Stay focused on UM rather than flying to an unrelated global result.
      fitted = true;
    }

    renderSidebar();
    drawAssessmentZones();

    /* Stats */
    $("stat-count").textContent = shown;
    $("stat-locations").textContent = placements.length;
    $("stat-avg").textContent = downloadCount
      ? fmtSpeed(totalDownload / downloadCount) + " Mbps"
      : "—";

    pings.sort(function (a, b) {
      return a - b;
    });
    $("stat-ping").textContent = pings.length
      ? Math.round(pings[Math.floor(pings.length / 2)]) + " ms"
      : "—";

    TIERS.forEach(function (tier) {
      var el = $("legend-" + tier.id);
      if (el) el.textContent = counts[tier.id];
    });

    $("stat-updated").textContent = lastLoaded
      ? new Date(lastLoaded).toLocaleTimeString()
      : "—";

    if (shown === 0) {
      banner(
        records.length === 0
          ? "No results yet. Be the first — run a test on the speed test page."
          : "No results match these filters.",
        "warn"
      );
    } else {
      banner("");
    }
  }

  function banner(message, tone) {
    var el = $("banner");
    if (!message) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent = message;
    el.dataset.tone = tone || "warn";
  }

  function localRaw() {
    try {
      var value = JSON.parse(localStorage.getItem("hifipulse:results") || "[]");
      return Array.isArray(value) ? value : [];
    } catch (e) { return []; }
  }
  function localRecords() {
    return localRaw().map(function (item) {
          return normalise({
            Latitude: item.latitude, Longitude: item.longitude,
            Download: item.download, Upload: item.upload,
            Ping: item.ping, Jitter: item.jitter,
            Accuracy: item.accuracy, Building: item.building,
            Floor: item.floor, Timestamp: item.timestamp, Provider: item.provider,
            testStatus: item.testStatus, TestId: item.testId
          });
        }).filter(Boolean);
  }

  function updateProviderOptions() {
    var select = $("map-provider"), selected = select.value;
    select.replaceChildren();
    var all = new Option("All networks", "all");
    select.add(all);
    var names = ["Campus Wi-Fi", "TM", "U Mobile", "CelcomDigi", "Maxis", "Tune Talk", "OneXOX", "REDtone", "Other / unsure"];
    names.forEach(function (name) { select.add(new Option(name, name)); });
    select.value = names.includes(selected) ? selected : "all";
  }

  /* ---- Loading ----------------------------------------------------------- */
  async function load() {
    var button = $("btn-refresh");
    button.disabled = true;
    $("status-line").textContent = "Loading results…";

    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 8000);
    try {
      var res = await fetch(cfg.sheetCsvUrl, { cache: "no-store", signal: controller.signal });
      if (!res.ok) throw new Error("HTTP " + res.status);

      var text = await res.text();
      if (/^\s*</.test(text)) {
        throw new Error(
          "That URL returned a web page, not CSV. Publish the sheet as CSV and use the ?output=csv link."
        );
      }

      var rows = window.HifiCsv.toObjects(window.HifiCsv.parse(text));
      assessmentRecords = window.HifiStability.dedupe(rows.concat(localRaw()).map(function (r) {
        return window.HifiStability.normalise(r, window.HifiPlaceCheck);
      }).filter(Boolean));
      records = rows.map(normalise).filter(Boolean);
      // The published sheet can lag behind a recent submission. Prefer the
      // local, more precisely rounded copy when TestId matches. Server and
      // client timestamps differ, so timestamp alone is not a reliable key.
      var byId = new Map(), byLegacyPosition = new Map();
      records.forEach(function (r) {
        if (r.testId) byId.set(r.testId, r);
        byLegacyPosition.set([r.ts, r.lat, r.lon].join(":"), r);
      });
      localRecords().forEach(function (r) {
        var key = [r.ts, r.lat, r.lon].join(":");
        var existing = r.testId ? byId.get(r.testId) : byLegacyPosition.get(key);
        if (existing) Object.assign(existing, r);
        else {
          records.push(r);
          if (r.testId) byId.set(r.testId, r);
          byLegacyPosition.set(key, r);
        }
      });
      lastLoaded = Date.now();
      updateProviderOptions();
      $("status-line").textContent =
        records.length + (records.length === 1 ? " result" : " results") + " loaded.";
      render();
      window.dispatchEvent(new CustomEvent("hifipulse:records", { detail: records.slice() }));
    } catch (err) {
      assessmentRecords = window.HifiStability.dedupe(localRaw().map(function (r) {
        return window.HifiStability.normalise(r, window.HifiPlaceCheck);
      }).filter(Boolean));
      records = localRecords();
      lastLoaded = Date.now();
      updateProviderOptions();
      render();
      window.dispatchEvent(new CustomEvent("hifipulse:records", { detail: records.slice() }));
      $("status-line").textContent = records.length
        ? "Showing results saved on this device. Community feed unavailable."
        : "Community feed unavailable. Run a test to add a local result.";
      if (records.length) banner("Community results unavailable: " + err.message, "warn");
    } finally {
      clearTimeout(timeout);
      button.disabled = false;
    }
  }

  /* ---- Wiring ------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", function () {
    deadZoneReports = readDeadZones();
    renderDeadZoneList();
    $("show-dead-zones").addEventListener("change", drawDeadZones);
    $("dead-zone-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var provider = $("dead-zone-provider").value;
      var issue = $("dead-zone-issue").value;
      var status = $("dead-zone-status");
      if (!provider || !issue) { status.textContent = "Select a network and an issue."; return; }
      if (!navigator.geolocation) { status.textContent = "Location is not available in this browser."; return; }
      status.textContent = "Finding your location…";
      navigator.geolocation.getCurrentPosition(function (pos) {
        var lat = Number(pos.coords.latitude.toFixed(3));
        var lon = Number(pos.coords.longitude.toFixed(3));
        if (pos.coords.accuracy > 200) {
          status.textContent = "Location is too approximate (over 200 m). Try again at the spot."; return;
        }
        if (lat < 3.11 || lat > 3.14 || lon < 101.64 || lon > 101.68) {
          status.textContent = "Reports must be within the UM campus area."; return;
        }
        var report = {
          id: window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
          lat: lat, lon: lon, provider: provider, issue: issue,
          place: $("dead-zone-place").value.trim().slice(0, 60), ts: Date.now()
        };
        var previous = deadZoneReports;
        deadZoneReports = [report].concat(deadZoneReports).slice(0, 50);
        if (!saveDeadZones()) {
          deadZoneReports = previous;
          status.textContent = "Could not save report: local storage is unavailable."; return;
        }
        $("dead-zone-form").reset();
        status.textContent = "Marked on this device. This is a report, not a verified outage.";
        map.setView([lat, lon], 17);
        drawDeadZones(); renderDeadZoneList();
      }, function () { status.textContent = "Location unavailable. Allow access and retry at the spot."; },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 });
    });
    /* Build the legend once from config. */
    var legend = $("legend");
    TIERS.forEach(function (tier) {
      var span = document.createElement("span");
      var dot = document.createElement("i");
      dot.style.background = tier.color;
      var label = document.createElement("span");
      label.textContent = tier.label + " ";
      var count = document.createElement("b");
      count.id = "legend-" + tier.id;
      count.textContent = "0";
      count.style.color = "#eef2f8";
      span.appendChild(dot);
      span.appendChild(label);
      span.appendChild(count);
      legend.appendChild(span);
    });

    var incompleteLegend = document.createElement("span");
    var incompleteDot = document.createElement("i");
    incompleteDot.style.background = "#71807a";
    var incompleteLabel = document.createElement("span");
    incompleteLabel.textContent = "Incomplete · speed unknown ";
    var incompleteCount = document.createElement("b");
    incompleteCount.id = "legend-incomplete";
    incompleteCount.textContent = "0";
    incompleteLegend.append(incompleteDot, incompleteLabel, incompleteCount);
    legend.appendChild(incompleteLegend);
    var candidateHint = document.createElement("span");
    var candidateIcon = document.createElement("i");
    candidateIcon.className = "assessment-ring-key";
    candidateHint.appendChild(candidateIcon);
    candidateHint.appendChild(document.createTextNode("Assessment-ready candidate · observed, not guaranteed"));
    legend.appendChild(candidateHint);

    /* Hollow-marker hint. */
    var hollow = document.createElement("span");
    var hollowDot = document.createElement("i");
    hollowDot.className = "hollow";
    hollowDot.style.color = "#93a0b8";
    var hollowLabel = document.createElement("span");
    hollowLabel.textContent = "approximate position";
    hollow.appendChild(hollowDot);
    hollow.appendChild(hollowLabel);
    legend.appendChild(hollow);

    document.querySelectorAll(".chip input").forEach(function (input) {
      input.addEventListener("change", render);
    });
    $("test-search").addEventListener("input", function () { sidebarLimit = 40; renderSidebar(); });
    $("test-list-more").addEventListener("click", function () { sidebarLimit += 40; renderSidebar(); });
    $("range").addEventListener("change", render);
    map.on("zoomend", render);
    $("show-incomplete").addEventListener("change", render);
    $("show-assessment").addEventListener("change", render);
    $("map-provider").addEventListener("change", render);
    $("btn-refresh").addEventListener("click", load);
    var query = new URLSearchParams(window.location.search);
    var lat = Number(query.get("lat")), lon = Number(query.get("lon"));
    if (query.has("lat") && query.has("lon") && Number.isFinite(lat) && Number.isFinite(lon) &&
        lat >= 3.11 && lat <= 3.14 && lon >= 101.64 && lon <= 101.68) {
      map.setView([lat, lon], 17);
    }
    document.querySelectorAll("[data-zone]").forEach(function (button) {
      button.addEventListener("click", function () {
        var zone = window.HifiZones[button.dataset.zone];
        map.setView(zone.center, zone.zoom || 17);
      });
    });
    window.addEventListener("hifipulse:map-visible", function () { map.invalidateSize(); });
    $("btn-locate").addEventListener("click", function () {
      var status = $("location-status");
      if (!navigator.geolocation) { status.textContent = "Location is not supported here."; return; }
      status.textContent = "Finding your location…";
      navigator.geolocation.getCurrentPosition(function (position) {
        map.setView([position.coords.latitude, position.coords.longitude], 15);
        status.textContent = "Centered near your location (not shared).";
      }, function () { status.textContent = "Location unavailable. Check browser permissions."; },
      { timeout: 10000, maximumAge: 300000 });
    });

    load();

    if (cfg.map.refreshMs > 0) {
      setInterval(function () {
        if (!document.hidden) load();
      }, cfg.map.refreshMs);
    }
  });
})();
