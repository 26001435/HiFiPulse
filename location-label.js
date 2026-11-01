/* Display-only labels: floor and place are self-reported, never GPS-verified. */
(function (root) {
  'use strict';
  function floor(value) {
    var text = String(value || '').trim().replace(/\s+/g, ' ').slice(0, 20);
    if (/^\d{1,2}$/.test(text)) return 'L' + text;
    if (/^l\s*\d{1,2}$/i.test(text)) return 'L' + text.replace(/\D/g, '');
    if (/^b\s*\d{1,2}$/i.test(text)) return 'B' + text.replace(/\D/g, '');
    return text;
  }
  function label(building, level) {
    var name = String(building || '').trim().slice(0, 60);
    if (!name) return 'Approximate location · place not reported';
    name = name.replace(/\((Blok [^)]+)\)/i, '$1');
    var normalizedFloor = floor(level);
    return name + (normalizedFloor ? ' ' + normalizedFloor : ' · floor not reported');
  }
  var api = { floor: floor, label: label };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HifiLocationLabel = api;
})(typeof window !== 'undefined' ? window : globalThis);
