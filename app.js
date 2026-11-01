/* ============================================================================
 * HiFiPulse — speed test page controller.
 * Wires the measurement engine to the DOM, collects context, and submits.
 * ==========================================================================*/
(function () {
  "use strict";

  var cfg = window.HIFIPULSE;
  var engine = null;
  var running = false;
  var userCancelled = false;
  var tipTimer = null;
  var currentTip = 0;
  var tipBag = [];
  var tips = [
    "For a fair result, pause large downloads and stay in one place during the test.",
    "A crowded access point can slow Wi-Fi even when the router is working normally.",
    "Pause cloud backups and game updates until after peak lecture hours.",
    "Disconnect secondary devices you are not using; active downloads matter most.",
    "Thick walls may weaken both Wi-Fi and cellular signals. Try a different seat.",
    "Download lecture materials before class when possible, then sync your work later.",
    "One test is a snapshot. Compare several results at similar times before choosing a study spot.",
    "A dead zone is an area with little or no usable signal. A slow test alone does not prove one.",
    "Tethering shares your phone’s mobile data with another device. Check your data allowance first.",
    "Full Wi-Fi bars but no internet? The problem may be upstream, not the signal to the router.",
    "Use only the official campus network. Avoid lookalike hotspots and unknown open Wi-Fi.",
    "On an unfamiliar network, check for HTTPS and keep your device and browser updated.",
    "Secure a personal hotspot with WPA2 or WPA3 and a unique passphrase, then turn it off when done.",
    "A phone VPN does not necessarily cover a laptop using its hotspot; protect each device separately.",
    "If mobile data is slow, move away from a windowless concrete room before blaming campus Wi-Fi."
  ];
  function nextTip() {
    // Shuffle a full deck before repeating, avoiding back-to-back duplicates.
    if (!tipBag.length) {
      tipBag = tips.map(function (_, i) { return i; }).filter(function (i) { return i !== currentTip; });
      for (var i = tipBag.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var swap = tipBag[i]; tipBag[i] = tipBag[j]; tipBag[j] = swap;
      }
    }
    currentTip = tipBag.pop();
    $("test-tip").textContent = tips[currentTip];
  }

  function $(id) {
    return document.getElementById(id);
  }

  function round(value, decimals) {
    var f = Math.pow(10, decimals);
    return Math.round(value * f) / f;
  }

  function isFiniteNumber(v) {
    return typeof v === "number" && isFinite(v);
  }

  function uid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return (
      Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10)
    );
  }

  function isMobile() {
    if (navigator.userAgentData && typeof navigator.userAgentData.mobile === "boolean") {
      return navigator.userAgentData.mobile;
    }
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }

  function setStatus(text, tone) {
    var el = $("status");
    el.textContent = text;
    el.dataset.tone = tone || "info";
  }

  function setPhase(text) {
    $("phase").textContent = text;
  }

  function setMetric(id, value) {
    var metric = id.slice(4);
    // A zero-byte download progress event is not a measured 0 Mbps result.
    var measured = isFiniteNumber(value) && value >= 0 && !(metric === "download" && value === 0);
    $(id).textContent = measured
      ? value.toFixed(metric === "download" && value > 0 && value < 0.01 ? 6 :
        metric === "download" && value < 1 ? 4 : 2) : "—";
    var container = $(id).closest(".metric");
    var meter = container.querySelector(".quality-track");
    var rating = measured ? window.HifiQuality.rate(metric, value) : null;
    container.dataset.quality = rating ? rating.key : "unmeasured";
    meter.querySelector(".quality-fill").style.width = rating ? rating.fill.toFixed(1) + "%" : "0%";
    meter.setAttribute("aria-valuenow", rating ? String(rating.score) : "0");
    meter.setAttribute("aria-valuetext", rating ? rating.label + ", " + $(id).textContent +
      (metric === "download" || metric === "upload" ? " Mbps" : " ms") : "Not measured");
    container.querySelector(".quality-label").textContent = rating ? rating.label : "Not measured";
  }

  var samples = [];
  var stages = ["latency", "download", "upload", "save"];
  function setStage(stage) {
    var current = stages.indexOf(stage);
    document.querySelectorAll(".test-steps li").forEach(function (item) {
      var position = stages.indexOf(item.dataset.stage);
      item.dataset.state = current < 0 ? "waiting" :
        position < current ? "done" : position === current ? "active" : "waiting";
    });
  }
  function addDownloadSample(mbps) {
    if (!isFiniteNumber(mbps) || mbps <= 0) return;
    samples.push(mbps);
    if (samples.length > 60) samples.shift();
    var max = Math.max.apply(null, samples);
    var points = samples.map(function (value, i) {
      var x = samples.length === 1 ? 180 : i * 360 / (samples.length - 1);
      return [x, 85 - (value / max) * 73];
    });
    $("trend-line").setAttribute("points", points.map(function (point) {
      return point[0].toFixed(1) + "," + point[1].toFixed(1);
    }).join(" "));
    $("trend-dot").hidden = false;
    $("trend-dot").setAttribute("cx", points[points.length - 1][0].toFixed(1));
    $("trend-dot").setAttribute("cy", points[points.length - 1][1].toFixed(1));
    $("trend-label").textContent = samples.length + " live reading" + (samples.length === 1 ? "" : "s");
  }

  function resetMetrics() {
    setMetric("val-download", null);
    setMetric("val-upload", null);
    setMetric("val-ping", null);
    setMetric("val-jitter", null);
    $("progress-fill").style.width = "0%";
    setStage(null);
    samples = [];
    $("live-trend").hidden = true;
    $("trend-line").setAttribute("points", "");
    $("trend-dot").hidden = true;
    $("trend-label").textContent = "Waiting for a measured sample…";
    $("edge").textContent = "";
    $("result").hidden = true;
  }

  function setProgress(fraction) {
    var pct = Math.max(0, Math.min(1, fraction)) * 100;
    $("progress-fill").style.width = pct.toFixed(1) + "%";
    document.querySelector(".progress").setAttribute("aria-valuenow", String(Math.round(pct)));
  }

  /* ---- Geolocation ------------------------------------------------------ */
  function getPosition() {
    return new Promise(function (resolve) {
      if (!navigator.geolocation) {
        resolve({ ok: false, reason: "unsupported" });
        return;
      }

      var settled = false;
      var finish = function (value) {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      /* getCurrentPosition can hang forever if the permission prompt is
         ignored, because the `timeout` option only starts after a grant. */
      var guard = setTimeout(function () {
        finish({ ok: false, reason: "timeout" });
      }, cfg.geo.timeoutMs + 2000);

      navigator.geolocation.getCurrentPosition(
        function (pos) {
          clearTimeout(guard);
          finish({
            ok: true,
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
        },
        function (err) {
          clearTimeout(guard);
          finish({
            ok: false,
            reason: err.code === 1 ? "denied" : "unavailable"
          });
        },
        {
          enableHighAccuracy: true,
          timeout: cfg.geo.timeoutMs,
          maximumAge: cfg.geo.maximumAgeMs
        }
      );
    });
  }

  function describeGeo(geo) {
    if (geo.ok) {
      return (
        "Location: ±" +
        Math.round(geo.accuracy) +
        " m (rounded to ~" +
        (cfg.geo.decimals === 3 ? "110 m" : "1.1 km") +
        " before sending)."
      );
    }

    var why =
      geo.reason === "denied"
        ? "Location denied"
        : geo.reason === "timeout"
        ? "Location timed out"
        : "Location unavailable";

    if (cfg.campus && cfg.campus.center) {
      return why + " — using the campus centre, so this point is approximate.";
    }
    return why + " — this result will not appear on the map.";
  }

  /* ---- Submission ------------------------------------------------------- */
  function buildPayload(result, geo) {
    var d = cfg.geo.decimals;
    var lat = null;
    var lon = null;
    var accuracy = null;
    var source = "none";

    if (geo.ok) {
      lat = round(geo.lat, d);
      lon = round(geo.lon, d);
      accuracy = Math.round(geo.accuracy);
      source = "gps";
    } else if (
      cfg.campus &&
      cfg.campus.center &&
      cfg.campus.center.length === 2
    ) {
      lat = round(cfg.campus.center[0], d);
      lon = round(cfg.campus.center[1], d);
      accuracy = 5000;
      source = "campus";
    }

    return {
      token: cfg.submitToken,
      schemaVersion: cfg.schemaVersion,
      testId: uid(),
      timestamp: new Date().toISOString(),
      download: isFiniteNumber(result.download) ? round(result.download,
        result.download > 0 && result.download < 0.01 ? 6 : result.download < 1 ? 4 : 2) : null,
      upload: isFiniteNumber(result.upload) ? round(result.upload, 2) : null,
      ping: isFiniteNumber(result.ping) ? round(result.ping, 1) : null,
      jitter: isFiniteNumber(result.jitter) ? round(result.jitter, 1) : null,
      latitude: lat,
      longitude: lon,
      accuracy: accuracy,
      geoSource: source,
      building: ($("input-building").value || "").trim().slice(0, 60),
      floor: window.HifiLocationLabel.floor($("input-floor").value),
      provider: $("input-provider").value,
      connection:
        (navigator.connection && navigator.connection.effectiveType) || "",
      device: isMobile() ? "mobile" : "desktop",
      country: (result.edge && result.edge.country) || "",
      colo: (result.edge && result.edge.colo) || "",
      testStatus: result.testStatus || "complete",
      testProfile: $("test-profile").value
    };
  }

  async function submit(payload) {
    var url = cfg.submitUrl;
    if (!url || url.indexOf("PASTE_YOUR_") === 0) {
      return { ok: false, reason: "not-configured" };
    }

    var body = JSON.stringify(payload);

    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 8000);
    try {
      /* text/plain is a CORS-safelisted content type, so this stays a
         "simple request" and skips the preflight that Apps Script cannot
         answer. Do NOT use application/json here. */
      var res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: body,
        cache: "no-store",
        redirect: "follow",
        signal: controller.signal
      });

      if (!res.ok) return { ok: false, reason: "http-" + res.status };

      var data = null;
      try {
        data = await res.json();
      } catch (e) {
        data = null;
      }

      if (data && data.ok) return { ok: true, duplicate: !!data.duplicate };
      if (data && data.error) return { ok: false, reason: data.error };
      return { ok: true, unverified: true };
    } catch (err) {
      if (controller.signal.aborted) return { ok: false, reason: "unconfirmed" };
      /* The redirect to script.googleusercontent.com occasionally breaks
         CORS. Retry as an opaque fire-and-forget POST so the data still
         lands, then report honestly that we could not confirm it. */
      var retry = new AbortController();
      var retryTimeout = setTimeout(function () { retry.abort(); }, 8000);
      try {
        await fetch(url, { method: "POST", mode: "no-cors", body: body, signal: retry.signal });
        return { ok: false, reason: "unconfirmed" };
      } catch (err2) {
        return { ok: false, reason: retry.signal.aborted ? "unconfirmed" : "network" };
      } finally { clearTimeout(retryTimeout); }
    } finally { clearTimeout(timeout); }
  }

  function reportSubmission(outcome, payload, localSaved) {
    var box = $("result");
    box.hidden = false;
    box.replaceChildren();
    var incomplete = payload.testStatus === "incomplete";
    var located = payload.latitude !== null && payload.longitude !== null;
    var localNotice = localSaved ? " It is visible on this device's map." : " It could not be stored on this device.";
    if (outcome.ok) {
      setStatus(incomplete
        ? "Download unavailable; this is an incomplete attempt, not a 0 Mbps speed." + (located ? (localSaved ? localNotice : " It was sent for saving but could not be stored on this device.") : " No map point: location unavailable.")
        : (outcome.duplicate ? "Already recorded." : "Result sent for saving.") + (located ? localNotice : " No map point: location unavailable."),
      incomplete ? "warn" : "ok");
    } else {
      var messages = {
        "not-configured": "No submission endpoint is configured.",
        unconfirmed: "Could not confirm the community save.",
        network: "Network unavailable while submitting.",
        "http-403": "The server rejected the submission.",
        "http-429": "The server rate-limited the submission."
      };
      setStatus((incomplete ? "Download unavailable; recorded as an incomplete attempt, not 0 Mbps. " : "Test finished. ") +
        (messages[outcome.reason] || "Community save failed (" + outcome.reason + ").") +
        (located ? localNotice : " No map point: location unavailable."), "warn");
    }
    var again = document.createElement("button");
    again.type = "button";
    again.className = "btn btn-ghost btn-again";
    again.textContent = "Test again";
    again.addEventListener("click", start);
    box.appendChild(again);
    if (located && localSaved) {
      var link = document.createElement("a");
      link.href = "map.html";
      link.className = "link";
      link.textContent = "Open this device's map →";
      box.appendChild(link);
    } else if (!located) {
      var fallback = document.createElement("a");
      fallback.href = "map.html";
      fallback.className = "link";
      fallback.textContent = "If location becomes available, mark an unverified dead zone on the map →";
      box.appendChild(fallback);
    }
  }

  /* ---- Main flow -------------------------------------------------------- */
  async function start() {
    if (running) return;
    if (!$("input-provider").value) {
      setStatus("Choose the network you are testing before starting.", "warn");
      $("input-provider").focus();
      return;
    }
    running = true;
    userCancelled = false;
    nextTip();
    tipTimer = setInterval(nextTip, 6500);

    $("btn-start").disabled = true;
    $("test-profile").disabled = true;
    $("btn-cancel").hidden = false;
    $("result").hidden = true;
    resetMetrics();
    setProgress(0);
    setStatus("Starting…", "info");
    setStage("latency");

    var geoPromise = getPosition();
    var profile = $("test-profile").value;
    engine = new window.HifiPulseEngine(window.HifiPulseEngine.withProfile(cfg, profile));

    try {
      var result = await engine.run({
        onPhase: function (phase) {
          if (phase === "latency") {
            setStage("latency");
            setPhase("Measuring latency…");
            setProgress(0.05);
          } else if (phase === "download") {
            setStage("download");
            $("live-trend").hidden = false;
            setPhase("Measuring download…");
            setProgress(0.3);
          } else if (phase === "upload") {
            setStage("upload");
            setPhase("Measuring upload…");
            setProgress(0.7);
          } else {
            setPhase("Preparing result…");
            setProgress(0.85);
          }
        },
        onProgress: function (p) {
          if (p.phase === "latency") {
            setMetric("val-ping", p.ping);
            setMetric("val-jitter", p.jitter);
            setProgress(0.05 + (p.sample / p.total) * 0.2);
          } else if (p.phase === "download") {
            addDownloadSample(p.mbps);
            setMetric("val-download", p.mbps);
            setProgress(0.5);
          } else if (p.phase === "upload") {
            setMetric("val-upload", p.mbps);
            setProgress(0.7);
          }
        }
      });

      setMetric("val-download", result.download);
      $("trend-label").textContent = result.download === null
        ? "No reliable download reading — attempt is incomplete."
        : "Final measured download: " + $("val-download").textContent + " Mbps";
      setMetric("val-upload", result.upload);
      setMetric("val-ping", result.ping);
      setMetric("val-jitter", result.jitter);
      setProgress(0.88);

      if (result.edge && (result.edge.country || result.edge.colo)) {
        $("edge").textContent =
          "Measured through Cloudflare " +
          (result.edge.colo || "edge") +
          (result.edge.country ? " (" + result.edge.country + ")" : "");
      }

      setStage("save");
      setProgress(0.9);
      if (result.download === null) document.querySelector('[data-stage="download"]').dataset.state = "skipped";
      if (result.upload === null) document.querySelector('[data-stage="upload"]').dataset.state = "skipped";
      setPhase(result.testStatus === "incomplete" ? "Recording incomplete attempt…" : "Saving result…");
      setStatus("Saving…", "info");

      var geo = await geoPromise;
      if (userCancelled) {
        resetMetrics();
        setStatus("Test cancelled; no result was saved.", "warn");
        setPhase("");
        return;
      }
      $("geo-status").textContent = describeGeo(geo);

      var payload = buildPayload(result, geo);
      var placeCheck = window.HifiPlaceCheck.check(payload.building, geo);
      // Keep the measurement at its actual GPS location, but never publish a
      // place/floor label when its approximate location contradicts the name.
      if (placeCheck === "mismatch" || placeCheck === "no-location" || placeCheck === "uncertain") {
        payload.building = "";
        payload.floor = "";
        if (placeCheck === "mismatch") {
          $("geo-status").textContent = "The selected area does not match your approximate location. The result will not include a place name or floor. Check your selection before testing again.";
        } else if (placeCheck === "uncertain") {
          $("geo-status").textContent = "Your location is too imprecise to associate this result with a named place. The result will not include a place name or floor.";
        } else {
          $("geo-status").textContent = "Location unavailable. The result will not include a place name or floor.";
        }
      }
      // Keep a device-local copy so the map remains useful even if the
      // community sheet is delayed or temporarily unreachable.
      var localSaved = false;
      if (payload.latitude !== null && payload.longitude !== null) {
        try {
          var local = JSON.parse(localStorage.getItem("hifipulse:results") || "[]");
          local.unshift(payload);
          localStorage.setItem("hifipulse:results", JSON.stringify(local.slice(0, 50)));
          localSaved = true;
        } catch (e) { /* Private browsing or full storage: remote save still works. */ }
      }
      if (payload.testStatus !== "incomplete" && $("input-suggest").checked && geo.ok && geo.accuracy <= 200 && payload.building) {
        window.HifiSpots.add(payload.building, $("input-space-type").value, payload.latitude, payload.longitude);
      }
      var outcome = await submit(payload);
      setPhase("");
      reportSubmission(outcome, payload, localSaved);
      setProgress(1);
      document.querySelector('[data-stage="save"]').dataset.state =
        localSaved || outcome.ok ? "done" : "skipped";
    } catch (err) {
      if (err && err.name === "AbortError") {
        resetMetrics();
        setStatus("Test cancelled.", "warn");
        setPhase("");
      } else {
        setStatus("Test failed: " + (err && err.message ? err.message : "unknown error"), "error");
        setPhase("");
      }
    } finally {
      clearInterval(tipTimer);
      tipTimer = null;
      running = false;
      $("btn-start").disabled = false;
      $("test-profile").disabled = false;
      $("btn-cancel").hidden = true;
    }
  }

  function cancel() {
    userCancelled = true;
    if (engine) engine.abort();
  }

  /* ---- Wiring ----------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    nextTip();
    function updateEstimate() {
      var profile = window.HifiPulseEngine.withProfile(cfg, $("test-profile").value);
      var estimate = window.HifiPulseEngine.estimateMegabytes(profile);
      $("estimate").textContent =
        "Up to ~" + estimate + " MB. A very slow connection may use less; an incomplete attempt is shown separately from measured speeds.";
    }
    $("test-profile").addEventListener("change", updateEstimate);
    updateEstimate();

    $("btn-start").addEventListener("click", start);
    try {
      var savedProvider = localStorage.getItem("hifipulse:provider");
      if (savedProvider && Array.from($("input-provider").options).some(function (o) { return o.value === savedProvider; }))
        $("input-provider").value = savedProvider;
    } catch (e) {}
    $("input-provider").addEventListener("change", function () {
      try { localStorage.setItem("hifipulse:provider", $("input-provider").value); } catch (e) {}
    });
    $("btn-cancel").addEventListener("click", cancel);
    $("tip-next").addEventListener("click", function () {
      nextTip();
      if (tipTimer) { clearInterval(tipTimer); tipTimer = setInterval(nextTip, 6500); }
    });

    // Show the same self-reported label that the map will display, without
    // changing the selected place or inventing a GPS-verified floor.
    function updateLocationPreview() {
      var name = $("input-building").value.trim();
      $("location-preview").textContent = name
        ? "Map label (self-reported): " + window.HifiLocationLabel.label(name, $("input-floor").value)
        : "Enter a place to preview how the location will appear.";
    }
    $("input-building").addEventListener("input", updateLocationPreview);
    $("input-building").addEventListener("change", updateLocationPreview);
    $("input-building").addEventListener("blur", function () { setTimeout(updateLocationPreview, 0); });
    // places.js owns the place combobox and its saved value.
    var floor = $("input-floor");
    try { floor.value = localStorage.getItem("hifipulse:input-floor") || ""; } catch (e) {}
    floor.addEventListener("input", function () {
      updateLocationPreview();
      try { localStorage.setItem("hifipulse:input-floor", floor.value); } catch (e) {}
    });
    updateLocationPreview();

    $("input-suggest").addEventListener("change", function () {
      $("study-type-field").hidden = !$("input-suggest").checked;
    });

    if (!cfg.submitUrl || cfg.submitUrl.indexOf("PASTE_YOUR_") === 0) {
      setStatus("Demo mode: no submit endpoint configured, results will not be saved.", "warn");
    }
  });
})();
