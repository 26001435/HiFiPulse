/* Playful labels reflect actual measurements, never a predicted connection. */
(function (root) {
  'use strict';
  var labels = {
    ping: { poor: 'Ouch, that ping hurts.', fair: 'Fair enough—ping is in the middle.', excellent: 'You slayed the ping.' },
    download: { poor: 'That download is having a rough time.', fair: 'Fair enough—download is in the middle.', excellent: 'Download came through strong.' },
    upload: { poor: 'Upload is struggling.', fair: 'Fair enough—upload is in the middle.', excellent: 'Upload is looking strong.' },
    jitter: { poor: 'Jitter is making this bumpy.', fair: 'Fair enough—jitter is in the middle.', excellent: 'Smooth sailing on jitter.' }
  };
  function feedback(metric, value, rate) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 ||
        metric === 'download' && value === 0) return null;
    var rating = rate(metric, value);
    return rating && labels[metric] && labels[metric][rating.key] || null;
  }
  function xp(result) {
    return ['ping', 'download', 'upload', 'jitter'].reduce(function (total, metric) {
      var value = result[metric];
      return total + (typeof value === 'number' && Number.isFinite(value) && value >= 0 &&
        !(metric === 'download' && value === 0) ? 25 : 0);
    }, 0);
  }
  var api = { feedback: feedback, xp: xp };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HifiTestFeedback = api;
})(typeof window !== 'undefined' ? window : globalThis);
