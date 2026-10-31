# HiFiPulse

Crowdsourced Wi-Fi measurements focused on the Universiti Malaya PASUM, KK12 and KK11 area. Serve this directory over HTTP (for example `python3 -m http.server 8000 --bind 0.0.0.0`) and open `index.html` to test or `map.html` to explore. Geolocation requires HTTPS or localhost.

## Campus views

The map defaults to the PASUM/KK12/KK11 area; the Campus and area buttons recenter it. Study spaces use tests within approximately 260 m of the closest area landmark, from the last 30 days. Ratings require at least three measurements; **they do not report desk availability**. Speed history shows up to 14 measured days, with daily median download speed and sample count. Unlocated results cannot contribute to these views. These are observational measurements, not guaranteed future performance.

Approximate landmark centers used for navigation: PASUM (3.12325, 101.65933), KK12 (3.12555, 101.6609), KK11 (3.1295, 101.66074). Sources: [PASUM Wikidata](https://www.wikidata.org/wiki/Q17627749), [KK12 location](https://malaysia.worldplaces.me/places-in-kuala-lumpur/1645592-kolej-kediaman-raja-dr-nazrin-shah-kk12-universiti-malaya.html), [KK11 location](https://malaysia.worldplaces.me/places-in-kuala-lumpur/2430003-kolej-kediaman-ungku-aziz-kk11-universiti-malaya.html). These points are approximate and should not be used as exact building outlines.

The community feed and submission endpoint are configured in `config.js` and require their external services to be available. Recent results on the same device remain available when the community feed is unavailable. Base map tiles require OpenStreetMap access. No sample readings or seat counts are fabricated.
