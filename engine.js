/* ============================================================================
 * HiFiPulse measurement engine.
 * ----------------------------------------------------------------------------
 * A small, dependency-free replacement for the LibreSpeed wrapper.
 *
 * Why not LibreSpeed? Its download/upload phases require a server that serves
 * a known-size payload (garbage.php / empty.php). A GitHub Pages site has no
 * backend, so the original `new Speedtest()` + `url_dl: "https://cloudflare.com"`
 * combination could never produce a real number. This engine talks to
 * CORS-open endpoints and reports null instead of inventing a value when a
 * phase is unavailable.
 *
 * Public API:
 *   const engine = new HifiPulseEngine(config);
 *   const result = await engine.run({ onPhase, onProgress });
 *   engine.abort();
 * ==========================================================================*/
(function () {
  "use strict";

  var now = function () {
    return typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();
  };

  function median(values) {
    if (!values.length) return null;
    var s = values.slice().sort(function (a, b) {
      return a - b;
    });
    var mid = s.length >> 1;
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }

  function meanJitter(values) {
    if (values.length < 2) return 0;
    var sum = 0;
    for (var i = 1; i < values.length; i++) {
      sum += Math.abs(values[i] - values[i - 1]);
    }
    return sum / (values.length - 1);
  }

  function joinUrl(base, params) {
    var q = Object.keys(params)
      .map(function (k) {
        return k + "=" + encodeURIComponent(params[k]);
      })
      .join("&");
    return base + (base.indexOf("?") === -1 ? "?" : "&") + q;
  }

  function randomToken() {
    return Math.random().toString(36).slice(2);
  }

  function abortError() {
    try {
      return new DOMException("The test was cancelled.", "AbortError");
    } catch (e) {
      var err = new Error("The test was cancelled.");
      err.name = "AbortError";
      return err;
    }
  }

  function HifiPulseEngine(config) {
    this.cfg = config;
    this.controller = null;
  }

  HifiPulseEngine.prototype.abort = function () {
    if (this.controller) this.controller.abort();
  };

  HifiPulseEngine.prototype.run = async function (handlers) {
    handlers = handlers || {};
    var onPhase = handlers.onPhase || function () {};
    var onProgress = handlers.onProgress || function () {};
    var cfg = this.cfg;

    this.controller = new AbortController();
    var signal = this.controller.signal;

    var result = {
      download: null,
      upload: null,
      ping: null,
      jitter: null,
      edge: {}
    };

    onPhase("latency");
    // Metadata must not hold up a test on an unusable connection.
    var tracePromise = this._trace(signal);
    try {
      var lat = await this._latency(signal, onProgress);
      result.ping = lat.ping;
      result.jitter = lat.jitter;
    } catch (err) {
      if (signal.aborted) throw abortError();
      // A failed latency probe does not rule out a useful download sample.
    }

    onPhase("download");
    try {
      result.download = await this._download(signal, onProgress);
    } catch (err) {
      if (signal.aborted) throw abortError();
      // No reliable download measurement: record the attempt, not 0 Mbps.
      result.testStatus = "incomplete";
      result.failureReason = "Download could not be measured";
    }

    if (result.download !== null) {
      onPhase("upload");
      try {
        result.upload = await this._upload(signal, onProgress);
      } catch (err) {
        if (signal.aborted) throw abortError();
        result.upload = null;
      }
    }
    // Do not wait indefinitely for optional edge metadata.
    result.edge = await Promise.race([
      tracePromise, new Promise(function (resolve) { setTimeout(function () { resolve({}); }, 1200); })
    ]);
    if (signal.aborted) throw abortError();

    onPhase("done");
    return result;
  };

  /* ---- Latency ---------------------------------------------------------- */
  HifiPulseEngine.prototype._latency = async function (signal, onProgress) {
    var cfg = this.cfg;
    var samples = [];
    var total = cfg.test.latencySamples;

    for (var i = 0; i < total; i++) {
      var url = joinUrl(cfg.endpoints.download, {
        bytes: 0,
        r: randomToken()
      });
      var t0 = now();
      var probe = new AbortController();
      var onAbort = function () { probe.abort(); };
      signal.addEventListener("abort", onAbort, { once: true });
      var timer = setTimeout(function () { probe.abort(); }, 3000);
      try {
        var res = await fetch(url, { cache: "no-store", signal: probe.signal });
        if (!res.ok) throw new Error("Latency probe failed (HTTP " + res.status + ")");
        await res.arrayBuffer();
      } finally {
        clearTimeout(timer);
        signal.removeEventListener("abort", onAbort);
      }
      var dt = now() - t0;

      /* The first probe pays for DNS + TCP + TLS. Exclude it. */
      if (i > 0) samples.push(dt);
      onProgress({
        phase: "latency",
        sample: i + 1,
        total: total,
        ping: median(samples),
        jitter: samples.length > 1 ? meanJitter(samples) : null
      });
    }

    if (!samples.length) throw new Error("No latency samples collected");
    return { ping: median(samples), jitter: meanJitter(samples) };
  };

  /* ---- Edge metadata -----------------------------------------------------
   * Country and edge location, used to label a result. Deliberately ignores
   * the `ip` field the trace also returns. Failure is non-fatal. ---------*/
  HifiPulseEngine.prototype._trace = async function (signal) {
    var url = this.cfg.endpoints && this.cfg.endpoints.trace;
    if (!url) return {};
    try {
      var res = await fetch(url, { cache: "no-store", signal: signal });
      if (!res.ok) return {};
      var text = await res.text();
      var fields = {};
      text.split("\n").forEach(function (line) {
        var i = line.indexOf("=");
        if (i > 0) fields[line.slice(0, i)] = line.slice(i + 1).trim();
      });
      return { country: fields.loc || "", colo: fields.colo || "" };
    } catch (err) {
      return {};
    }
  };

  /* ---- Download --------------------------------------------------------- */
  HifiPulseEngine.prototype._download = async function (signal, onProgress) {
    var t = this.cfg.test;
    var counter = { bytes: 0, reserved: 0 };
    var stopped = false;
    var ctrl = new AbortController();

    var stop = function () {
      stopped = true;
      ctrl.abort();
    };
    var onOuterAbort = function () {
      stop();
    };
    if (signal) signal.addEventListener("abort", onOuterAbort, { once: true });

    var start = now();
    var warmAt = 0;
    var warmBytes = 0;

    var warmTimer = setTimeout(function () {
      warmAt = now();
      warmBytes = counter.bytes;
    }, t.downloadWarmupMs);
    var endTimer = setTimeout(stop, t.downloadDurationMs);
    var progressTimer = setInterval(function () {
      if (!warmAt) return;
      var secs = (now() - warmAt) / 1000;
      if (secs > 0.05) {
        onProgress({
          phase: "download",
          mbps: ((counter.bytes - warmBytes) * 8) / secs / 1e6
        });
      }
    }, 250);

    var self = this;
    var pump = async function () {
      while (!stopped && counter.reserved < t.maxDownloadBytes) {
        var chunk = Math.min(t.downloadChunkBytes, t.maxDownloadBytes - counter.reserved);
        counter.reserved += chunk;
        var url = joinUrl(self.cfg.endpoints.download, {
          bytes: chunk,
          r: randomToken()
        });
        var res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
        if (!res.ok) throw new Error("Download failed (HTTP " + res.status + ")");

        if (!res.body || !res.body.getReader) {
          counter.bytes += (await res.arrayBuffer()).byteLength;
          continue;
        }

        var reader = res.body.getReader();
        try {
          for (;;) {
            var step = await reader.read();
            if (step.done) break;
            counter.bytes += step.value.byteLength;
            if (stopped || counter.bytes >= t.maxDownloadBytes) {
              reader.cancel().catch(function () {});
              break;
            }
          }
        } catch (err) {
          if (!stopped) throw err;
        }
      }
    };

    var streams = [];
    for (var s = 0; s < t.downloadStreams; s++) streams.push(pump());

    try {
      await Promise.all(streams);
    } catch (err) {
      if (signal && signal.aborted) throw abortError();
      // The duration timer intentionally aborts in-flight streams. Bytes
      // already received are the valid measurement, not a failed test.
      if (!stopped) { ctrl.abort(); throw err; }
    } finally {
      clearTimeout(warmTimer);
      clearTimeout(endTimer);
      clearInterval(progressTimer);
      if (signal) signal.removeEventListener("abort", onOuterAbort);
    }

    if (signal && signal.aborted) throw abortError();

    var finish = now();
    // If all bytes arrived during warmup, use the full transfer instead of
    // discarding an otherwise valid fast result.
    var useWarmup = warmAt && counter.bytes > warmBytes;
    var from = useWarmup ? warmAt : start;
    var fromBytes = useWarmup ? warmBytes : 0;
    var seconds = Math.max((finish - from) / 1000, 0.001);
    var bits = (counter.bytes - fromBytes) * 8;

    if (counter.bytes === 0 || bits <= 0) throw new Error("Download produced no measurable data");
    return bits / seconds / 1e6;
  };

  /* ---- Upload ----------------------------------------------------------- */
  HifiPulseEngine.prototype._upload = async function (signal, onProgress) {
    var t = this.cfg.test;
    var payload = new Uint8Array(t.uploadBytes);

    /* Incompressible payload: random bytes stop the network stack from
       cheating on a highly compressible all-zero buffer. */
    if (window.crypto && window.crypto.getRandomValues) {
      for (var i = 0; i < payload.length; i += 65536) {
        window.crypto.getRandomValues(
          payload.subarray(i, Math.min(i + 65536, payload.length))
        );
      }
    }

    var ctrl = new AbortController();
    var onAbort = function () { ctrl.abort(); };
    signal.addEventListener("abort", onAbort, { once: true });
    var timer = setTimeout(function () { ctrl.abort(); }, t.uploadTimeoutMs || 8000);
    var best = 0;
    try {
      for (var r = 0; r < t.uploadRounds; r++) {
        onProgress({
          phase: "upload",
          round: r + 1,
          rounds: t.uploadRounds,
          mbps: best || null
        });

        var t0 = now();
        var res = await fetch(this.cfg.endpoints.upload, {
          method: "POST",
          body: payload,
          cache: "no-store",
          signal: ctrl.signal
        });
        if (!res.ok) throw new Error("Upload failed (HTTP " + res.status + ")");
        try {
          await res.arrayBuffer();
        } catch (e) {
          /* Body is irrelevant; we only needed the round-trip. */
        }

        var seconds = Math.max((now() - t0) / 1000, 0.001);
        best = Math.max(best, (payload.length * 8) / seconds / 1e6);
        onProgress({
          phase: "upload",
          round: r + 1,
          rounds: t.uploadRounds,
          mbps: best
        });
      }

    } finally {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
    }

    return best;
  };

  HifiPulseEngine.withProfile = function (config, mode) {
    if (mode !== "light" && mode !== "heavy") throw new Error("Unknown test profile");
    var test = Object.assign({}, config.test);
    if (mode === "light") Object.assign(test, {
      downloadStreams: 1, downloadChunkBytes: 1024 * 1024,
      maxDownloadBytes: 6 * 1024 * 1024, downloadWarmupMs: 0,
      downloadDurationMs: 5000, uploadBytes: 2 * 1024 * 1024,
      uploadRounds: 1, uploadTimeoutMs: 5000, latencySamples: 4
    });
    return Object.assign({}, config, { test: test });
  };

  /* Rough per-test data cost, used by the UI to warn mobile users. */
  HifiPulseEngine.estimateMegabytes = function (config) {
    var t = config.test;
    var bytes =
      t.maxDownloadBytes + t.uploadBytes * t.uploadRounds + 8 * 1024;
    return Math.round(bytes / (1024 * 1024));
  };

  window.HifiPulseEngine = HifiPulseEngine;
})();
