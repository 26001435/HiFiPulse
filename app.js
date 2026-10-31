/* ============================================================================
 * HiFiPulse — speed test page controller.
 * Wires the measurement engine to the DOM, collects context, and submits.
 * ==========================================================================*/
(function () {
  "use strict";

  var cfg = window.HIFIPULSE;
  var engine = null;
  var running = false;
  var tipTimer = null;
  var tipIndex = 0;
  var tips = [
    "For a fair result, pause large downloads and stay in one place during the test.",
    "A crowded access point can slow Wi-Fi even when the router is working normally.",
    "Pause cloud backups and game updates until after peak lecture hours.",
    "Disconnect secondary devices you are not using; active downloads matter most.",
    "Thick walls may weaken both Wi-Fi and cellular signals. Try a seat closer to an official access point.",
    "Download lecture materials before class when possible, then sync your work later.",
    "One test is a snapshot. Compare several results at similar times before choosing a study spot."
  ];
  function nextTip() {
    tipIndex = (tipIndex + 1) % tips.length;
    $("test-tip").textContent = tips[tipIndex];
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
    $(id).textContent = isFiniteNumber(value) ? value.toFixed(2) : "—";
  }

  function resetMetrics() {
    setMetric("val-download", null);
    setMetric("val-upload", null);
    setMetric("val-ping", null);
    setMetric("val-jitter", null);
    $("progress-fill").style.width = "0%";
    $("result").hidden = true;
  }

  function setProgress(fraction) {
    var pct = Math.max(0, Math.min(1, fraction)) * 100;
    $("progress-fill").style.width = pct.toFixed(1) + "%";
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
      download: isFiniteNumber(result.download) ? round(result.download, 2) : null,
      upload: isFiniteNumber(result.upload) ? round(result.upload, 2) : null,
      ping: isFiniteNumber(result.ping) ? round(result.ping, 1) : null,
      jitter: isFiniteNumber(result.jitter) ? round(result.jitter, 1) : null,
      latitude: lat,
      longitude: lon,
      accuracy: accuracy,
      geoSource: source,
      building: (($("input-building").value === "custom" ? $("input-custom-building").value : $("input-building").value) || "").trim().slice(0, 60),
      floor: ($("input-floor").value || "").trim().slice(0, 20),
      connection:
        (navigator.connection && navigator.connection.effectiveType) || "",
      device: isMobile() ? "mobile" : "desktop",
      country: (result.edge && result.edge.country) || "",
      colo: (result.edge && result.edge.colo) || ""
    };
  }

  async function submit(payload) {
    var url = cfg.submitUrl;
    if (!url || url.indexOf("PASTE_YOUR_") === 0) {
      return { ok: false, reason: "not-configured" };
    }

    var body = JSON.stringify(payload);

    try {
      /* text/plain is a CORS-safelisted content type, so this stays a
         "simple request" and skips the preflight that Apps Script cannot
         answer. Do NOT use application/json here. */
      var res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: body,
        cache: "no-store",
        redirect: "follow"
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
      /* The redirect to script.googleusercontent.com occasionally breaks
         CORS. Retry as an opaque fire-and-forget POST so the data still
         lands, then report honestly that we could not confirm it. */
      try {
        await fetch(url, { method: "POST", mode: "no-cors", body: body });
        return { ok: false, reason: "unconfirmed" };
      } catch (err2) {
        return { ok: false, reason: "network" };
      }
    }
  }

  function reportSubmission(outcome) {
    var box = $("result");
    box.hidden = false;

    if (outcome.ok) {
      setStatus(
        outcome.duplicate
          ? "Already recorded. This result was saved earlier."
          : "Saved. Your result is on the map.",
        "ok"
      );
      box.innerHTML = "";
      var link = document.createElement("a");
      link.href = "map.html";
      link.className = "link";
      link.textContent = "Open the live map →";
      box.appendChild(link);
      return;
    }

    var messages = {
      "not-configured":
        "Test complete. This deployment has no submit endpoint configured yet, so nothing was saved.",
      unconfirmed:
        "Test complete. We couldn't confirm the save — your result may still appear on the map shortly.",
      network: "Test complete. Network error while saving — your result was not recorded.",
      "http-403": "Test complete. The server rejected the token — your result was not recorded.",
      "http-429": "Test complete. Rate limited by the server — try again later."
    };
    setStatus(messages[outcome.reason] || "Test complete, but saving failed (" + outcome.reason + ").", "warn");
  }

  /* ---- Main flow -------------------------------------------------------- */
  async function start() {
    if (running) return;
    running = true;
    nextTip();
    tipTimer = setInterval(nextTip, 6500);

    $("btn-start").disabled = true;
    $("btn-cancel").hidden = false;
    $("result").hidden = true;
    resetMetrics();
    setProgress(0);
    setStatus("Starting…", "info");

    var geoPromise = getPosition();
    engine = new window.HifiPulseEngine(cfg);

    try {
      var result = await engine.run({
        onPhase: function (phase) {
          if (phase === "latency") {
            setPhase("Measuring latency…");
            setProgress(0.05);
          } else if (phase === "download") {
            setPhase("Measuring download…");
            setProgress(0.3);
          } else if (phase === "upload") {
            setPhase("Measuring upload…");
            setProgress(0.7);
          } else {
            setPhase("Finishing…");
            setProgress(0.98);
          }
        },
        onProgress: function (p) {
          if (p.phase === "latency") {
            setMetric("val-ping", p.ping);
            setProgress(0.05 + (p.sample / p.total) * 0.2);
          } else if (p.phase === "download") {
            setMetric("val-download", p.mbps);
            setProgress(0.5);
          } else if (p.phase === "upload") {
            setMetric("val-upload", p.mbps);
            setProgress(0.7);
          }
        }
      });

      setMetric("val-download", result.download);
      setMetric("val-upload", result.upload);
      setMetric("val-ping", result.ping);
      setMetric("val-jitter", result.jitter);
      setProgress(1);

      if (result.edge && (result.edge.country || result.edge.colo)) {
        $("edge").textContent =
          "Measured through Cloudflare " +
          (result.edge.colo || "edge") +
          (result.edge.country ? " (" + result.edge.country + ")" : "");
      }

      setPhase("Saving result…");
      setStatus("Saving…", "info");

      var geo = await geoPromise;
      $("geo-status").textContent = describeGeo(geo);

      var payload = buildPayload(result, geo);
      // Keep a device-local copy so the map remains useful even if the
      // community sheet is delayed or temporarily unreachable.
      if (payload.latitude !== null && payload.longitude !== null) {
        try {
          var local = JSON.parse(localStorage.getItem("hifipulse:results") || "[]");
          local.unshift(payload);
          localStorage.setItem("hifipulse:results", JSON.stringify(local.slice(0, 50)));
        } catch (e) { /* Private browsing or full storage: remote save still works. */ }
      }
      if ($("input-suggest").checked && geo.ok && geo.accuracy <= 200 && payload.building) {
        window.HifiSpots.add(payload.building, $("input-space-type").value, payload.latitude, payload.longitude);
      }
      var outcome = await submit(payload);
      setPhase("");
      reportSubmission(outcome);
    } catch (err) {
      if (err && err.name === "AbortError") {
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
      $("btn-cancel").hidden = true;
    }
  }

  function cancel() {
    if (engine) engine.abort();
  }

  /* ---- Wiring ----------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    var estimate = window.HifiPulseEngine.estimateMegabytes(cfg);
    $("estimate").textContent =
      "Uses up to ~" + estimate + " MB of data. On mobile data? Switch to Wi-Fi first.";

    $("btn-start").addEventListener("click", start);
    $("btn-cancel").addEventListener("click", cancel);
    $("tip-next").addEventListener("click", nextTip);

    /* Remember the location context across visits. */
    ["input-building", "input-custom-building", "input-floor"].forEach(function (id) {
      var el = $(id);
      try {
        var saved = localStorage.getItem("hifipulse:" + id);
        if (saved) el.value = saved;
      } catch (e) {
        /* storage can be blocked; not fatal */
      }
      el.addEventListener("input", function () {
        try {
          localStorage.setItem("hifipulse:" + id, el.value);
        } catch (e) {}
      });
    });

    function toggleCustomPlace() {
      $("custom-place-field").hidden = $("input-building").value !== "custom";
    }
    $("input-building").addEventListener("change", toggleCustomPlace);
    toggleCustomPlace();
    $("input-suggest").addEventListener("change", function () {
      $("study-type-field").hidden = !$("input-suggest").checked;
    });

    if (!cfg.submitUrl || cfg.submitUrl.indexOf("PASTE_YOUR_") === 0) {
      setStatus("Demo mode: no submit endpoint configured, results will not be saved.", "warn");
    }
  });
})();
