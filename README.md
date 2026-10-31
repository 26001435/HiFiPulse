# HiFiPulse

Crowdsourced Wi-Fi measurements focused on the Universiti Malaya PASUM, KK12 and KK11 area. Serve this directory over HTTP (for example `python3 -m http.server 8000 --bind 0.0.0.0`) and open `index.html` to test or `map.html` to explore. Geolocation requires HTTPS or localhost.

## Campus views

The map defaults to the PASUM/KK12/KK11 area; the Campus and area buttons recenter it. Study spaces use tests within approximately 260 m of the closest area landmark, from the last 30 days. Ratings require at least three measurements; **they do not report desk availability**. Speed history shows up to 14 measured days, with daily median download speed and sample count. Unlocated results cannot contribute to these views. These are observational measurements, not guaranteed future performance.

Approximate landmark centers used for navigation: PASUM (3.12325, 101.65933), KK12 (3.12555, 101.6609), KK11 (3.1295, 101.66074). Sources: [PASUM Wikidata](https://www.wikidata.org/wiki/Q17627749), [KK12 location](https://malaysia.worldplaces.me/places-in-kuala-lumpur/1645592-kolej-kediaman-raja-dr-nazrin-shah-kk12-universiti-malaya.html), [KK11 location](https://malaysia.worldplaces.me/places-in-kuala-lumpur/2430003-kolej-kediaman-ungku-aziz-kk11-universiti-malaya.html). These points are approximate and should not be used as exact building outlines.

The community feed and submission endpoint are configured in `config.js` and require their external services to be available. Recent results on the same device remain available when the community feed is unavailable. Base map tiles require OpenStreetMap access. No sample readings or seat counts are fabricated.

## Place selection and time of day

The speed-test page offers a fixed list of supplied place names (duplicates removed), plus **Other / custom place** for names not listed. Floor remains optional. The time-of-day tab uses historical test timestamps grouped into Malaysia time (MYT, UTC+8), with a 24-hour selector and sample counts. The map displays tests from the approximate UM focus area for the chosen hour; **All hours** shows all campus-area tests. This is not a live network prediction. Tests without timestamps cannot be assigned to an hour.

## Study-space suggestions

Study spaces are student suggestions, **not** classrooms, labs or staff-only rooms. On the map's Study spaces tab, a student can propose a café, study cube, bench, lounge or library area using geolocation. A speed-test user can also opt in to suggest their selected place. Suggestions made directly in the form are saved **on this device only**: the existing Google Sheet endpoint stores speed-test rows, not a shared suggestions database. Clearly named café, bench, lounge, library or study-cube locations in shared speed-test rows can be discovered across devices after the sheet publishes those rows. Other suggested names remain device-local until a shared suggestions backend is added.

Candidates appear immediately, but a "consistently good" blue map marker requires at least three named, nearby tests in the last 30 days, on at least two distinct days, with the lower quartile of download speeds at least 25 Mbps. Rankings put qualified spots first, then other measured spots by median speed, then unmeasured suggestions. GPS fixes worse than 200 m are not used for recommendations. No desk occupancy data is collected.

## Connectivity guide

`guide.html` offers practical congestion-reduction habits, lecture-hall troubleshooting context, and a short digital-equity/SDG explainer with links to the NDIA, UN goals and Malaysia's Ministry of Digital. The speed test cycles contextual tips while it runs; users can also advance them manually. Wi-Fi capacity and cellular reception are different issues: neither can be diagnosed conclusively from a single browser speed test.

## Network labels and comparison

Before testing, choose the connection actually being used: Campus Wi-Fi, TM, U Mobile, CelcomDigi, Maxis, Tune Talk, OneXOX, REDtone, or Other / unsure. Carrier detection is **not automatic**: browsers do not reliably expose the cellular provider. A tester on mobile data should turn Wi-Fi off before testing; saved selection is only a convenience and must be checked each time. Provider names are self-reported and unverified.

The map can filter by network, and the Compare networks tab aggregates median download speed and ping near PASUM, KK12 and KK11. It shows sample counts, marks groups with fewer than three tests as limited, and does not make coverage guarantees. Legacy unlabeled measurements are excluded from provider comparisons. The existing external Google Apps Script/sheet schema is not included in this repository: **provider labels are retained in device-local results, but cross-device comparison requires updating the remote write endpoint to store the new `provider` payload field and publishing a `Provider` column in the CSV**. Until then the UI must not be treated as a campus-wide provider survey.

## Reported dead zones

The coverage map includes a **Mark a dead zone** form for the selected network and issue (no signal, unable to connect, or connected but unusable). It requires an on-campus geolocation fix accurate within 200 m, rounds coordinates to three decimal places before storage, and draws a distinct red dashed ring. Reports are unverified observations, not measured network speed or an official outage. They are saved only in this browser, can be removed by the reporter, and are hidden from the historical time-of-day map; the network filter also applies to reports. No shared dead-zone database or server endpoint exists yet, so reports cannot be seen across devices. A report can be made after a test failed, provided the map page is reachable.

The guide also includes a concise network lexicon, a Wi-Fi/cellular/upstream troubleshooting comparison, and safer hotspot/public-network habits. Speed-test tips use a shuffled deck: manual Next and automatic rotation draw from the same deck without repeating a tip until the deck is exhausted. Guidance distinguishes congestion from intentional throttling and warns that unknown open networks should be avoided while official campus Wi-Fi may still be appropriate.

## Place search

The speed-test place field is an editable combobox. Typing filters the curated locations (including Main Library, PASUM, KK11 and KK12 additions), while a new name can still be entered. Matching existing names are canonicalized on blur to reduce duplicate labels. Arrow keys and Enter select suggestions; Escape closes the list. Location coordinates are still obtained separately through browser geolocation, not inferred from a name.
