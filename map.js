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
  var records = [];
  var fitted = false;
  var lastLoaded = null;

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

  /* ---- Normalisation ----------------------------------------------------- */
  function normalise(row) {
    var lat = num(field(row, ["Latitude", "lat"]));
    var lon = num(field(row, ["Longitude", "lon", "lng", "Long"]));
    if (lat === null || lon === null) return null;
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;

    var download = num(field(row, ["Download", "Download (Mbps)"]));
    var accuracy = num(field(row, ["Accuracy", "accuracy"]));

    return {
      lat: lat,
      lon: lon,
      download: download,
      upload: num(field(row, ["Upload", "Upload (Mbps)"])),
      ping: num(field(row, ["Ping", "Ping (ms)"])),
      jitter: num(field(row, ["Jitter", "Jitter (ms)"])),
      accuracy: accuracy,
      building: field(row, ["Building", "Location"]),
      floor: field(row, ["Floor"]),
      connection: field(row, ["Connection"]),
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
    speed.textContent = fmt(rec.download, 1);
    var unit = document.createElement("span");
    unit.className = "popup-unit";
    unit.textContent = "Mbps download";
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
          "Location",
          rec.building + (rec.floor ? " · floor " + rec.floor : "")
        )
      );
    }
    if (rec.connection) {
      el.appendChild(popupRow("Link", rec.connection));
    }

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

  /* ---- Rendering --------------------------------------------------------- */
  function activeTiers() {
    var out = {};
    TIERS.forEach(function (tier) {
      var input = document.querySelector('.chip input[value="' + tier.id + '"]');
      out[tier.id] = !input || input.checked;
    });
    return out;
  }

  function render() {
    layer.clearLayers();

    var enabled = activeTiers();
    var range = $("range").value;
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
    var counts = { fast: 0, ok: 0, slow: 0 };
    var bounds = [];

    records.forEach(function (rec) {
      if (cutoff !== null && rec.ts !== null && rec.ts < cutoff) return;

      var tier = tierFor(rec.download === null ? 0 : rec.download);
      if (!enabled[tier.id]) return;

      counts[tier.id] += 1;
      shown += 1;
      if (rec.download !== null) {
        totalDownload += rec.download;
        downloadCount += 1;
      }
      if (rec.ping !== null) pings.push(rec.ping);

      var precise =
        rec.accuracy === null || rec.accuracy <= cfg.map.preciseAccuracyM;

      var marker = L.circleMarker([rec.lat, rec.lon], {
        radius: precise ? 7 : 5,
        color: "#ffffff",
        weight: precise ? 1.5 : 1,
        fillColor: tier.color,
        fillOpacity: precise ? 0.9 : 0.22,
        opacity: precise ? 1 : 0.75
      });

      marker.bindPopup(buildPopup(rec, tier), { maxWidth: 270 });
      marker.addTo(layer);
      bounds.push([rec.lat, rec.lon]);
    });

    if (!fitted && bounds.length) {
      // Stay focused on UM rather than flying to an unrelated global result.
      fitted = true;
    }

    /* Stats */
    $("stat-count").textContent = shown;
    $("stat-avg").textContent = downloadCount
      ? (totalDownload / downloadCount).toFixed(1) + " Mbps"
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

  function localRecords() {
    try {
      return JSON.parse(localStorage.getItem("hifipulse:results") || "[]")
        .map(function (item) {
          return normalise({
            Latitude: item.latitude, Longitude: item.longitude,
            Download: item.download, Upload: item.upload,
            Ping: item.ping, Jitter: item.jitter,
            Accuracy: item.accuracy, Building: item.building,
            Floor: item.floor, Timestamp: item.timestamp
          });
        }).filter(Boolean);
    } catch (e) { return []; }
  }

  /* ---- Loading ----------------------------------------------------------- */
  async function load() {
    var button = $("btn-refresh");
    button.disabled = true;
    $("status-line").textContent = "Loading results…";

    try {
      var res = await fetch(cfg.sheetCsvUrl, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);

      var text = await res.text();
      if (/^\s*</.test(text)) {
        throw new Error(
          "That URL returned a web page, not CSV. Publish the sheet as CSV and use the ?output=csv link."
        );
      }

      var rows = window.HifiCsv.toObjects(window.HifiCsv.parse(text));
      records = rows.map(normalise).filter(Boolean);
      // The published sheet can lag behind a recent submission. Show local
      // measurements as well, avoiding duplicate timestamps from the sheet.
      var seen = new Set(records.map(function (r) { return [r.ts, r.lat, r.lon].join(":"); }));
      localRecords().forEach(function (r) {
        var key = [r.ts, r.lat, r.lon].join(":");
        if (!seen.has(key)) { records.push(r); seen.add(key); }
      });
      lastLoaded = Date.now();
      $("status-line").textContent =
        records.length + (records.length === 1 ? " result" : " results") + " loaded.";
      render();
      window.dispatchEvent(new CustomEvent("hifipulse:records", { detail: records.slice() }));
    } catch (err) {
      records = localRecords();
      lastLoaded = Date.now();
      render();
      window.dispatchEvent(new CustomEvent("hifipulse:records", { detail: records.slice() }));
      $("status-line").textContent = records.length
        ? "Showing results saved on this device. Community feed unavailable."
        : "Community feed unavailable. Run a test to add a local result.";
      if (records.length) banner("Community results unavailable: " + err.message, "warn");
    } finally {
      button.disabled = false;
    }
  }

  /* ---- Wiring ------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", function () {
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
    $("range").addEventListener("change", render);
    $("btn-refresh").addEventListener("click", load);
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
