# Changelog

Development milestones for HiFiPulse. Pull-request numbers below describe merged development work, **not** versioned product releases. This log records implemented UI and repository changes, not proof that external hosting or Google Sheet integrations are operational.

## Unreleased

### Fixed
- Restored the flat site layout: `index.html`, `map.html`, `guide.html` and `about.html` are served directly from the repository root again.
- Corrected stylesheet, icon and JavaScript paths after the `main/` and `assets/` folders were removed; kept bundled Leaflet assets in `vendor/`.
- Renamed `assets.js` back to `spots.js` so the script filename matches its study-spot purpose and the page references.
- Updated README links and local run instructions to match the restored layout. The PITRAM proposal remains a separate Markdown document, not the site entry page.

## Earlier development milestones

### [PR #9](https://github.com/26001435/HiFiPulse/pull/9) — PITRAM proposal and folder-path repair
- Added `PITRAM_PROPOSAL.md` with a written proposal, spoken pitch and pilot plan.
- Added an entry page and asset paths for the then-current folder structure; those paths were superseded by the flat-layout restoration above.

### [PR #8](https://github.com/26001435/HiFiPulse/pull/8) — Project documentation and About us
- Expanded the README with objectives, architecture, limitations and roadmap.
- Added the About us page and project changelog.

### [PR #7](https://github.com/26001435/HiFiPulse/pull/7) — Searchable place entry
- Replaced the fixed place selector with a searchable combobox that still accepts custom names.
- Added more campus locations around the Main Library, PASUM, KK11 and KK12.
- Added brief, reduced-motion-aware heading entrances.

### [PR #6](https://github.com/26001435/HiFiPulse/pull/6) — Editorial interface
- Reworked the interface around restrained typography, whitespace and flatter layouts.
- Put network and location selection before starting a speed test; clarified data-related copy.

### [PR #5](https://github.com/26001435/HiFiPulse/pull/5) — Heading motion
- Introduced subtle title animation with a reduced-motion option; the visual approach was subsequently simplified in PR #6.

### [PR #4](https://github.com/26001435/HiFiPulse/pull/4) — Networks and connectivity education
- Added manual network labels, map filtering and per-area provider comparisons.
- Added device-local, unverified dead-zone reports.
- Expanded the guide with troubleshooting, hotspot safety and rotating test tips.

### [PR #3](https://github.com/26001435/HiFiPulse/pull/3) — Study suggestions and guide
- Added study-space suggestions and evidence-based rankings with distinct markers for consistently good test results.
- Added the connectivity guide and time-of-day map view.

### [PR #2](https://github.com/26001435/HiFiPulse/pull/2) — UM campus focus
- Focused the map on PASUM, KK12 and KK11 and added area controls, study-space and speed-history views.

### [PR #1](https://github.com/26001435/HiFiPulse/pull/1) — Core usability
- Fixed static asset loading, bundled Leaflet, corrected timed speed-test completion and added local map fallback for recent measurements.

## Known integration gaps

- A shared suggestions or dead-zone backend has not been implemented; those reports remain device-local.
- Cross-device provider comparisons need the external submission service and published CSV to persist the provider field.
- Map tiles, test endpoints and the published results feed depend on external services. No seat-occupancy, predictive network-capacity or institutional dashboard is implemented.
