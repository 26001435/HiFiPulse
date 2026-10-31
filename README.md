# HiFiPulse

**The living nervous system for campus connectivity** — a student-facing prototype for measuring network performance and understanding access around Universiti Malaya (UM), initially focused on PASUM, KK11 and KK12.

A student can test the connection they are actually using, label the place and network, and inspect approximate results on a campus map. The project also provides historical views, a study-space finder, student-reported dead zones and a practical Wi-Fi guide. It does **not** claim live seat occupancy, automatic carrier detection or a verified coverage map.

## Why this project exists

1. **Improve digital equity.** Reliable access to coursework should not depend on a student's mobile-data budget or which building they happen to use. Crowdsourced, location-aware measurements can make gaps visible to students, student representatives and, eventually, campus IT. Sample sizes and uncertainty matter: an isolated slow test is evidence to investigate, not proof of a failed network.
2. **Find better places to study and save time.** Compare nearby measurements before walking between a library, café, study cube or residence. Rank non-classroom study spots using repeated tests rather than an unverified claim that a desk is free. More coverage and more samples are needed before recommendations become dependable.
3. **Increase connectivity awareness.** Explain the differences between weak Wi-Fi, congested networks, poor cellular reception and upstream outages. Help people test responsibly, protect their personal hotspot and understand why infrastructure upgrades—not just individual behaviour—are sometimes required.

The educational mission connects to [UN SDG 4 (Quality Education), SDG 9 (Industry, Innovation and Infrastructure) and SDG 10 (Reduced Inequalities)](https://sdgs.un.org/goals). HiFiPulse is an independent student project; it is not an official UM network service or a UN programme.

## Explore the app

| Page | What it does |
| --- | --- |
| [Speed test](index.html) | Measures download, upload, ping and jitter via Cloudflare's public speed endpoints. Users manually choose the network and type/search a place name. A test may consume substantial data; the page shows an estimate before starting. |
| [Coverage map](map.html) | Shows approximate, colour-coded test points; filters by speed, time and network; centers on PASUM, KK12 and KK11. Reads the published CSV plus recent measurements saved in this browser. |
| Study spaces ([Rankings](rankings.html)) | Lists suggested non-classroom spaces. A strong-coverage label needs at least three matching tests within 180 m over two or more days in the last 30 days, with the lower quartile of download speeds at least 25 Mbps. Suggestions without enough evidence remain unrated. |
| Speed history (map tab) | Displays daily median download results by campus area. These are historical observations, **not** predictions. |
| [Rankings](rankings.html) | A separate Campus Wi-Fi leaderboard: top five individual downloads (today, last 7 days or all time), highest speed today in Malaysia time, daily test count, 30-day hourly averages and ranked study spaces. Only geolocated, timestamped, self-labelled Campus Wi-Fi tests qualify; no fabricated results or student identities. |
| Compare networks (map tab) | Compares self-reported Campus Wi-Fi, TM, U Mobile, CelcomDigi, Maxis, Tune Talk, OneXOX and REDtone samples around the three focus areas. Groups with fewer than three tests are labelled limited. |
| Dead-zone reports (map) | Lets a person pin an approximate, **unverified** report for a selected network. Red dashed rings are separate from speed-test points. Reports can be removed from the same browser. |
| [Wi-Fi guide](guide.html) | Explains congestion, troubleshooting, safer public-network and hotspot habits, digital equity and related SDGs. The test page also rotates short tips. |
| [About us](about.html) | States the mission, methodology, current limitations and planned next steps. |

The place search offers curated campus names including the Main Library, PASUM, KK11 and KK12, but also accepts custom names. An exact match is normalized to the curated spelling. A place name never substitutes for a GPS fix.

The site follows the device theme by default; the header control saves a light/dark preference in this browser. The main navigation has About us, Speed test and Coverage map; the About us dropdown offers Our Mission and Wi-Fi guide; the Coverage map dropdown offers the map, speed history, network comparisons and Rankings. The theme toggle sits at the far right of the header. The leaderboard is a competition between **measurements**, not identifiable students. Today uses Malaysia time; only correctly labelled Campus Wi-Fi observations with a usable approximate location are eligible. Missing data produces an empty state, not a sample score. Outliers and self-reported places remain possible: these are informal results, not certified records.

## Run locally

No build step or package installation is required. Serve the repository over HTTP:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Open `http://localhost:8000/`. Geolocation requires **HTTPS or localhost**; a LAN address served over plain HTTP may not be eligible. The base map needs access to OpenStreetMap tiles, and measurements need access to the configured test endpoints. `file://` is not supported for reliable network and geolocation behaviour.

To deploy, publish the static files and update `config.js` with a reachable submission endpoint and published Google Sheet CSV. The source for the existing external Google Apps Script is **not** in this repository. Hosting static files alone will not create a shared results database. Test submission and feed access may fail if the external services are unavailable or block browser cross-origin requests; the UI reports failures rather than inventing a measurement.

## Data flow and limitations

- **Measurements:** `engine.js` performs the speed test; `app.js` gathers the selected place/network and a browser geolocation fix (if permitted), rounds coordinates to three decimals (~110 m latitude), saves a local copy and attempts to submit it to the configured external endpoint. If location is denied and no campus fallback is configured, the test cannot be placed on the map. A browser cannot reliably detect a cellular carrier: network labels are manually selected and unverified.
- **Community map:** `map.js` parses a published CSV with `csv.js` and combines it with up to 50 recent local measurements. The feed may lag; older rows may have no provider label. The map is not a live radio coverage survey. Approximate landmark coordinates used for navigation are [PASUM](https://www.wikidata.org/wiki/Q17627749) (3.12325, 101.65933), [KK12](https://malaysia.worldplaces.me/places-in-kuala-lumpur/1645592-kolej-kediaman-raja-dr-nazrin-shah-kk12-universiti-malaya.html) (3.12555, 101.6609) and [KK11](https://malaysia.worldplaces.me/places-in-kuala-lumpur/2430003-kolej-kediaman-ungku-aziz-kk11-universiti-malaya.html) (3.1295, 101.66074). They are approximate landmarks, not building footprints.
- **Study suggestions:** `spots.js` stores suggestions in this browser only. `rankings.js` can also discover clearly named cafés, benches, libraries, lounges and study cubes from published speed-test rows. Matching/ranking requires a name, sufficiently accurate location and repeated measurements; the app does not know whether a seat is available. Classrooms, labs and staff-only rooms are excluded from suggestions.
- **Dead-zone reports:** User-reported issues are stored only in this browser, with rounded coordinates and an initial fix accurate to within 200 m. They are unverified and do not sync to other devices. A student without connectivity may need to return to the app once online to file a report.
- **Provider comparison:** New local test results retain the `provider` field, but campus-wide provider comparisons require the external write endpoint to save that field and the published CSV to expose a `Provider` column. This repository cannot verify or update that external service. Unlabelled legacy rows are excluded.
- **Privacy:** Measurements contact Cloudflare endpoints; submitted results include metrics, a timestamp, selected place/network and approximate coordinates when available. Device-local suggestions and reports use localStorage and can be deleted with browser storage. Do not enter personal details in place names. The app does not claim that third-party services never process an IP address.

## Repository map

| File | Responsibility |
| --- | --- |
| `index.html`, `app.js`, `engine.js` | Measurement screen, submission and speed-test engine |
| `places.js` | Searchable curated-place combobox with custom entry |
| `map.html`, `map.js`, `csv.js` | Coverage map, data loading and local dead-zone reports |
| `insights.js`, `spots.js`, `rankings.js`, `rankings-core.js` | Map history/network comparisons, local suggestions and separate Wi-Fi leaderboard aggregation |
| `rankings.html`, `guide.html`, `about.html` | Rankings, connectivity education and project mission |
| `theme.js` | Persistent light/dark preference |
| `theme.css`, `vendor/` | Shared styling and bundled Leaflet map library |
| `config.js` | Test endpoints, map settings and external data-service URLs |
| `CHANGELOG.md` | Development milestones and upcoming changes |

## Roadmap

Shared, moderated suggestions and dead-zone reporting; a verified remote provider field; more campus-wide measurements; accessible, privacy-conscious data exports for student representatives and campus IT; and validation against actual network conditions. Predictive capacity, seat availability and institutional dashboards remain **ideas**, not implemented features.

See [CHANGELOG.md](CHANGELOG.md) for the development history and [About us](about.html) for the student-facing mission.

## Place-name integrity

Place names are **self-reported**, not proof that a device was inside a particular room or on a particular floor. The browser now compares names explicitly mentioning PASUM, KK11 or KK12 with a sufficiently accurate GPS fix and approximate area landmarks. If the fix contradicts the selected area, is less precise than 150 m, or is unavailable, the test can still be measured but its place/floor label is removed before local storage and submission. The map applies the same conservative filter to older published rows and labels remaining place names as self-reported. The map marker position always comes from geolocation, never from a typed name.

Names without vetted coordinates (including custom names and many individual buildings) **cannot be independently verified** by this check. Even a plausible fix cannot establish the exact room or rule out spoofed GPS. Study-space rankings still require repeated nearby tests; a production rollout also needs server-side validation, an authoritative campus place-coordinate catalogue, moderation and abuse controls. Browser-side checks alone cannot guarantee honest crowdsourced data.

Run the place check tests with `node --test tests/place-check.test.js`.
