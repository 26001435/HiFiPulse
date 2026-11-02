/**
 * HiFiPulse — Google Apps Script receiver (schema v2, additive columns)
 * ---------------------------------------------------------------------------
 * Bind this script to the Google Sheet whose first tab is published as CSV.
 * Run setup(), then redeploy the web app to a NEW VERSION. Keep the same /exec
 * URL if updating an existing deployment. Back up the sheet before migration.
 *
 * The client-side token is visible in config.js: it is a spam deterrent, not
 * authentication or a substitute for a moderated data pipeline.
 */

var SCHEMA_VERSION = 2;

// The first 16 headers are the existing sheet. Do not reorder them: existing
// rows must keep their meaning. Only append new columns to the right.
var LEGACY_HEADERS = [
  "Timestamp", "Download", "Upload", "Ping", "Jitter", "Latitude", "Longitude",
  "Accuracy", "GeoSource", "Building", "Floor", "Connection", "Device",
  "Country", "Colo", "TestId"
];
var HEADERS = LEGACY_HEADERS.concat(["Provider", "Test Status", "Test Profile"]);
var PROVIDERS = ["Campus Wi-Fi", "TM", "U Mobile", "CelcomDigi", "Maxis",
  "Tune Talk", "OneXOX", "REDtone", "Other / unsure"];
var LIMITS = {
  bodyBytes: 8192, mbps: 100000, latencyMs: 60000,
  accuracyM: 200000, writesPerMinute: 120
};

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return json_({ok:false, error:"empty-body"});
    if (e.postData.contents.length > LIMITS.bodyBytes) return json_({ok:false, error:"body-too-large"});
    var data;
    try { data = JSON.parse(e.postData.contents); }
    catch (parseError) { return json_({ok:false, error:"bad-json"}); }

    var expected = PropertiesService.getScriptProperties().getProperty("SUBMIT_TOKEN");
    if (!expected) return json_({ok:false, error:"not-configured"});
    if (!constantTimeEquals_(String(data.token || ""), expected)) return json_({ok:false, error:"forbidden"});
    if (Number(data.schemaVersion) !== SCHEMA_VERSION) return json_({ok:false, error:"schema-mismatch"});

    var testId = str_(data.testId, 64);
    if (!testId) return json_({ok:false, error:"missing-test-id"});
    var provider = str_(data.provider, 32);
    if (PROVIDERS.indexOf(provider) < 0) return json_({ok:false, error:"missing-or-invalid-provider"});
    var status = str_(data.testStatus || "complete", 16);
    if (status !== "complete" && status !== "incomplete") return json_({ok:false, error:"invalid-test-status"});
    var profile = str_(data.testProfile || "", 16);
    if (profile && profile !== "light" && profile !== "heavy") return json_({ok:false, error:"invalid-test-profile"});

    var download = num_(data.download, 0, LIMITS.mbps);
    var upload = num_(data.upload, 0, LIMITS.mbps);
    if (status === "complete" && download === null) return json_({ok:false, error:"no-download"});
    if (status === "incomplete" && download !== null) return json_({ok:false, error:"inconsistent-status"});

    // Three decimal places match the browser's approximate (~110 m) GPS
    // submission. The old script rounded every number to two decimals,
    // shifting map locations by up to roughly a kilometre.
    var latitude = num_(data.latitude, -90, 90, 3);
    var longitude = num_(data.longitude, -180, 180, 3);
    var geoSource = str_(data.geoSource, 12);
    if (status === "incomplete" && (latitude === null || longitude === null || geoSource !== "gps")) {
      return json_({ok:false, error:"incomplete-needs-gps"});
    }

    var cache = CacheService.getScriptCache();
    var dedupeKey = "t:" + testId;
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(15000)) return json_({ok:false, error:"busy"});
    try {
      // Check dedupe and rate budget inside the lock, not before it. Cache
      // dedupe is best-effort for 6 hours; this is not permanent identity.
      if (cache.get(dedupeKey)) return json_({ok:true, duplicate:true});
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
      ensureSchema_(sheet);
      if (!withinWriteBudget_(cache)) return json_({ok:false, error:"rate-limited"});
      var cells = {
        "Timestamp": new Date(),
        "Download": download,
        "Upload": upload,
        "Ping": num_(data.ping, 0, LIMITS.latencyMs),
        "Jitter": num_(data.jitter, 0, LIMITS.latencyMs),
        "Latitude": latitude,
        "Longitude": longitude,
        "Accuracy": num_(data.accuracy, 0, LIMITS.accuracyM),
        "GeoSource": geoSource === "gps" || geoSource === "campus" ? geoSource : "none",
        "Building": str_(data.building, 60),
        "Floor": str_(data.floor, 20),
        "Connection": str_(data.connection, 24),
        "Device": str_(data.device, 16),
        "Country": str_(data.country, 8),
        "Colo": str_(data.colo, 8),
        "TestId": testId,
        "Provider": provider,
        "Test Status": status,
        "Test Profile": profile
      };
      sheet.appendRow(HEADERS.map(function (header) { return cells[header]; }));
      cache.put(dedupeKey, "1", 21600);
      return json_({ok:true});
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return json_({ok:false, error:String(error && error.message ? error.message : error)});
  }
}

function doGet() {
  return json_({ok:true, service:"hifipulse", schemaVersion:SCHEMA_VERSION,
    time:new Date().toISOString()});
}

/** Run once on a BACKED-UP sheet; appends missing columns without moving rows. */
function setup() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  ensureSchema_(sheet);
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty("SUBMIT_TOKEN")) {
    props.setProperty("SUBMIT_TOKEN", Utilities.getUuid().replace(/-/g, ""));
  }
  Logger.log("Schema v" + SCHEMA_VERSION + " ready. Check Script Properties for SUBMIT_TOKEN. Columns: " + HEADERS.join(", "));
}

/** Print the client-side token to the editor log (never share the log). */
function showToken() {
  Logger.log(PropertiesService.getScriptProperties().getProperty("SUBMIT_TOKEN"));
}

/** Optional smoke test after deployment; its result is NOT a real ranking. */
function insertTestRow() {
  var fake = {postData:{contents:JSON.stringify({
    token:PropertiesService.getScriptProperties().getProperty("SUBMIT_TOKEN"),
    schemaVersion:SCHEMA_VERSION, testId:"smoke-test-" + Date.now(),
    download:42.5, upload:9.1, ping:18, jitter:3.2,
    latitude:3.139, longitude:101.687, accuracy:25,
    geoSource:"gps", building:"Test Building", floor:"2",
    provider:"Campus Wi-Fi", testStatus:"complete", testProfile:"light",
    connection:"4g", device:"desktop", country:"MY", colo:"SIN"
  })}};
  Logger.log(doPost(fake).getContent());
  Logger.log("Delete this clearly labelled smoke-test row afterwards. Its example GPS location is outside the leaderboard's UM bounds.");
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function num_(value, min, max, decimals) {
  if (value === null || value === undefined || value === "") return null;
  var n = Number(value);
  if (!isFinite(n) || n < min || n > max) return null;
  var scale = Math.pow(10, decimals === undefined ? 2 : decimals);
  return Math.round(n * scale) / scale;
}
function str_(value, maxLength) {
  if (value === null || value === undefined) return "";
  var s = String(value).replace(/[\u0000-\u001F\u007F]/g, " ").trim();
  if (s.length > maxLength) s = s.slice(0, maxLength);
  if (/^[=+@-]/.test(s)) s = "'" + s;
  return s;
}
function constantTimeEquals_(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function withinWriteBudget_(cache) {
  var limit = Number(PropertiesService.getScriptProperties().getProperty("MAX_WRITES_PER_MINUTE")) || LIMITS.writesPerMinute;
  var key = "w:" + Math.floor(Date.now() / 60000);
  var used = Number(cache.get(key) || 0);
  if (used >= limit) return false;
  cache.put(key, String(used + 1), 120);
  return true;
}

/**
 * Safe additive migration: the first 16 header cells MUST match the old
 * schema exactly. Append Provider, Test Status and Test Profile only at the
 * right edge; never replace or shift existing data. Anything else stops.
 */
function ensureSchema_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  var current = lastRow ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0] : [];
  var i;
  if (lastRow) {
    for (i = 0; i < Math.min(lastColumn, LEGACY_HEADERS.length); i++) {
      if (String(current[i] || "") !== LEGACY_HEADERS[i]) {
        throw new Error("Unexpected sheet header at column " + (i + 1) + "; back up and inspect before migration.");
      }
    }
    if (lastColumn < LEGACY_HEADERS.length) throw new Error("Incomplete legacy headers; migrate manually.");
    for (i = LEGACY_HEADERS.length; i < lastColumn; i++) {
      if (i >= HEADERS.length || String(current[i] || "") !== HEADERS[i]) {
        throw new Error("Unknown additional sheet column at " + (i + 1) + "; migrate manually.");
      }
    }
  }
  if (lastColumn === HEADERS.length && lastRow) return;
  if (sheet.getMaxColumns() < HEADERS.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), HEADERS.length - sheet.getMaxColumns());
  }
  if (!lastRow) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  } else {
    var extra = HEADERS.slice(lastColumn);
    sheet.getRange(1, lastColumn + 1, 1, extra.length).setValues([extra]);
    sheet.getRange(1, lastColumn + 1, 1, extra.length).setFontWeight("bold");
  }
}
