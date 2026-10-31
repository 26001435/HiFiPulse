/* ============================================================================
 * Minimal RFC 4180 CSV reader.
 * Replaces the PapaParse CDN dependency. Handles quotes, escaped quotes,
 * embedded commas/newlines, CRLF and a UTF-8 BOM.
 * ==========================================================================*/
(function () {
  "use strict";

  function parse(text) {
    if (typeof text !== "string") return [];
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

    var rows = [];
    var row = [];
    var field = "";
    var inQuotes = false;
    var i = 0;
    var len = text.length;

    while (i < len) {
      var ch = text.charAt(i);

      if (inQuotes) {
        if (ch === '"') {
          if (text.charAt(i + 1) === '"') {
            field += '"';
            i += 2;
            continue;
          }
          inQuotes = false;
          i += 1;
          continue;
        }
        field += ch;
        i += 1;
        continue;
      }

      if (ch === '"') {
        inQuotes = true;
        i += 1;
        continue;
      }
      if (ch === ",") {
        row.push(field);
        field = "";
        i += 1;
        continue;
      }
      if (ch === "\r") {
        i += 1;
        continue;
      }
      if (ch === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        i += 1;
        continue;
      }

      field += ch;
      i += 1;
    }

    if (field.length > 0 || row.length > 0) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  }

  /* Turn [[header...],[cell...]] into [{header: cell}] using the first row. */
  function toObjects(rows) {
    if (!rows || rows.length < 1) return [];
    var headers = rows[0].map(function (h) {
      return String(h).trim();
    });
    var out = [];

    for (var r = 1; r < rows.length; r++) {
      var cells = rows[r];
      if (!cells || !cells.length) continue;
      var obj = {};
      var hasValue = false;
      for (var c = 0; c < headers.length; c++) {
        var name = headers[c];
        if (!name) continue;
        var value = c < cells.length ? String(cells[c]).trim() : "";
        obj[name] = value;
        if (value !== "") hasValue = true;
      }
      if (hasValue) out.push(obj);
    }
    return out;
  }

  window.HifiCsv = { parse: parse, toObjects: toObjects };
})();
