/* ============================================================================
 * HiFiPulse — configuration
 * ----------------------------------------------------------------------------
 * This is the ONLY file you should need to edit to deploy.
 * Everything else (engine, UI, map) reads from window.HIFIPULSE.
 * ==========================================================================*/

window.HIFIPULSE = {
  /* Bump this when you change the sheet columns. The Apps Script checks it. */
  schemaVersion: 2,

  /* ------------------------------------------------------------------------
   * WRITE PATH — Google Apps Script web app.
   * Deploy apps-script/Code.gs, then paste the /exec URL and the token here.
   * While these still say PASTE_YOUR_..., the site runs the test but does
   * not submit, and tells the user so.
   * ----------------------------------------------------------------------*/
  submitUrl: "PASTE_YOUR_APPS_SCRIPT_EXEC_URL",
  submitToken: "PASTE_YOUR_SHARED_TOKEN",

  /* ------------------------------------------------------------------------
   * READ PATH — the public CSV of your sheet.
   * In Sheets: File > Share > Publish to web > (your tab) > CSV.
   * The URL must end in /pub?output=csv — NOT /pubhtml.
   * ----------------------------------------------------------------------*/
  sheetCsvUrl:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSszY88R08y5xYR7Jn6MHz7o1qTPziFFDYhjbbfVfELPu9KxSj44IwRBk9x7zQvnckZ_FFLrFeTYZrw/pub?output=csv",

  /* ------------------------------------------------------------------------
   * SPEED TEST ENDPOINTS
   * Cloudflare's public speed endpoints are CORS-open and need no key.
   * To self-host instead, see README ("Hosting your own endpoints").
   * ----------------------------------------------------------------------*/
  endpoints: {
    download: "https://speed.cloudflare.com/__down",
    upload: "https://speed.cloudflare.com/__up",
    /* Tiny text endpoint used only to label the result with the country and
       edge location. Set to "" to skip it entirely. */
    trace: "https://cloudflare.com/cdn-cgi/trace"
  },

  /* ------------------------------------------------------------------------
   * TEST TUNING — these control accuracy vs. mobile data usage.
   * Roughly: maxDownloadBytes + (uploadBytes * uploadRounds) = data per test.
   * Defaults ≈ 52 MB worst case. Lower them for metered-data users.
   * ----------------------------------------------------------------------*/
  test: {
    downloadStreams: 3,
    downloadChunkBytes: 4 * 1024 * 1024,
    maxDownloadBytes: 40 * 1024 * 1024,
    downloadWarmupMs: 1000,
    downloadDurationMs: 7000,
    uploadBytes: 6 * 1024 * 1024,
    uploadRounds: 2,
    latencySamples: 8
  },

  /* ------------------------------------------------------------------------
   * PRIVACY
   * Coordinates are rounded before they ever leave the browser.
   * 3 decimals ≈ 110 m. Use 2 (~1.1 km) for stricter privacy.
   * ----------------------------------------------------------------------*/
  geo: {
    decimals: 3,
    timeoutMs: 10000,
    maximumAgeMs: 300000
  },

  /* ------------------------------------------------------------------------
   * CAMPUS FALLBACK
   * If a visitor denies geolocation, their result can still be placed at the
   * campus centre instead of vanishing. Set center to [lat, lon] to enable;
   * leave null to skip results with no location entirely.
   * ----------------------------------------------------------------------*/
  campus: {
    label: "",
    center: null
  },

  /* ------------------------------------------------------------------------
   * MAP
   * ----------------------------------------------------------------------*/
  map: {
    refreshMs: 60000,
    center: [20, 0],
    zoom: 2,
    /* Markers whose GPS accuracy is worse than this (metres) are drawn
       hollow, so a city-level fallback is never mistaken for a precise fix. */
    preciseAccuracyM: 2000,
    tiers: [
      { id: "fast", label: "50+ Mbps", color: "#10b981", min: 50 },
      { id: "ok", label: "15–50 Mbps", color: "#f59e0b", min: 15 },
      { id: "slow", label: "under 15 Mbps", color: "#ef4444", min: 0 }
    ]
  }
};
