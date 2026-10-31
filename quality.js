/* Illustrative three-band connection ratings, not a network guarantee. */
(function (root) {
  'use strict';
  var limits = {
    download: { low: 15, high: 50, top: 100, higherBetter: true },
    upload: { low: 5, high: 20, top: 40, higherBetter: true },
    ping: { low: 120, high: 40, top: 0, higherBetter: false, worst: 500 },
    jitter: { low: 30, high: 10, top: 0, higherBetter: false, worst: 100 }
  };
  function rate(metric, value) {
    var t = limits[metric];
    if (!t || typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
    var score, fill;
    if (t.higherBetter) {
      if (value >= t.high) {
        score = 3;
        fill = 67 + 33 * Math.min(1, (value - t.high) / (t.top - t.high));
      } else if (value >= t.low) {
        score = 2;
        fill = 34 + 32 * (value - t.low) / (t.high - t.low);
      } else {
        score = 1;
        fill = 8 + 25 * Math.min(1, value / t.low);
      }
    } else if (value <= t.high) {
      score = 3;
      fill = 67 + 33 * (t.high - value) / (t.high - t.top);
    } else if (value <= t.low) {
      score = 2;
      fill = 34 + 32 * (t.low - value) / (t.low - t.high);
    } else {
      score = 1;
      fill = 8 + 25 * (1 - Math.min(1, (value - t.low) / (t.worst - t.low)));
    }
    return { score: score, label: ['Poor', 'Fair', 'Excellent'][score - 1],
      key: ['poor', 'fair', 'excellent'][score - 1], fill: Math.max(8, Math.min(100, fill)) };
  }
  var api = { rate: rate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HifiQuality = api;
})(typeof window !== 'undefined' ? window : globalThis);
