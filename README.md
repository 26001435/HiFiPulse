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
