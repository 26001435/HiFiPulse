# HiFiPulse — PITRAM innovation competition proposal

**Tagline:** Find a better place to connect. Make unequal access visible.  
**Proposed pilot:** Universiti Malaya (UM), starting around PASUM, KK11 and KK12  
**Project stage:** Working browser prototype; community infrastructure and institutional validation remain pilot objectives.

> **Submission note:** This is a competition-ready draft, not a claim of PITRAM endorsement, UM partnership, verified coverage, user traction or measured savings. Adapt word limits, team details and budget to the official PITRAM application form.

## Proposal at a glance

Campus connectivity is often treated as a single number: “Wi-Fi is available.” For students, availability is not enough. A connection may be usable in one study cube but unreliable in a crowded lecture hall, and the cost of falling back to mobile data is not shared equally. Students lose time searching for a place to work; campus decision-makers may lack student-experience evidence at the level of a building, area or time of day.

**HiFiPulse** is a student-facing, crowdsourced connectivity tool. Students run an **opt-in** browser speed test, identify the network they are actually using and choose a place. The prototype displays approximate results on a map around PASUM, KK11 and KK12; groups historical measurements by day and hour; and helps students compare non-classroom study spots and self-reported networks. It also distinguishes user-reported dead zones from measured results and teaches practical connectivity and hotspot safety.

Our three objectives are to **advance digital equity**, **save time finding a viable place to study**, and **increase awareness of connectivity issues**. The pilot would test whether repeated, privacy-conscious measurements can help students make better choices and give student representatives and campus IT a more useful starting point for investigating recurring gaps.

## The problem

Imagine submitting a project from a crowded campus space. Your laptop connects, but the upload stalls. You move to another floor without knowing whether the problem is the access point, the building's uplink, your mobile carrier or simply peak-hour demand. A generic coverage map cannot tell you how other students experienced that particular area at a similar time.

This is also an equity issue. A student with an ample data plan can switch networks; another student may not be able to. Connectivity problems affect access to digital coursework, learning materials and online assessments. They connect to [SDG 4 (Quality Education), SDG 9 (Industry, Innovation and Infrastructure) and SDG 10 (Reduced Inequalities)](https://sdgs.un.org/goals)—without implying that this prototype alone achieves those goals.

## The proposed solution

1. **Measure with context.** A student chooses a network and searchable campus place, then runs a browser test for download, upload, ping and jitter. If permitted, geolocation is rounded to approximately 110 m in latitude before submission. The interface estimates test data use and does not silently run background tests.
2. **Explore actual observations.** The coverage map shows measured points with speed and time filters. History and time-of-day views expose repeat patterns rather than presenting a single reading as a promise of future performance. A provider comparison shows sample counts and flags thin evidence.
3. **Find a workable study spot.** Students can suggest a café, library area, bench or study cube. The prototype avoids treating classrooms, labs and staff-only spaces as recommended study spots. A “consistently good” marker requires repeated, nearby named measurements over at least two days; it never claims a seat is available.
4. **Explain the issue, not just colour the map.** Separately marked, unverified dead-zone reports and a short Wi-Fi guide help students distinguish weak Wi-Fi, cellular reception, congestion and upstream problems. Tips include reducing avoidable downloads during peak hours and using personal hotspots securely.

**What makes it different:** The core unit of value is not a campus-wide average, but a **place × network × time × evidence count**. Student utility motivates participation; the resulting, carefully qualified measurements could support more targeted infrastructure conversations. Neither network capacity forecasts nor institutional dashboards are implemented today.

## What exists today—and what does not

The repository contains a working static prototype: speed-test interface and engine, curated and custom place search, an approximate Leaflet map, historical and time-of-day views, study-space rankings, network comparisons, dead-zone reporting and a connectivity guide. It can save recent tests locally and is configured to attempt submission to an external Google Apps Script and read a published CSV. **The external write service is not part of this repository and its operation has not been independently verified for this proposal.**

Study suggestions and dead-zone reports are currently **device-local**. Network names are self-reported, not auto-detected; cross-device provider comparison requires the remote data service to store and publish the provider field. There are **no verified participation figures, seat-availability data, capacity predictions, campus IT partnership or university-wide audit results** to claim at this stage.

## Pilot and validation plan (proposed)

**Phase 1 — Establish responsible data collection.** Verify the remote submission/feed path, add provider persistence, publish a concise privacy notice, and set retention, moderation and aggregation rules before accepting wider participation. Confirm that campus location labels and map placement are appropriate with pilot participants.

**Phase 2 — Run a limited UM pilot.** Invite volunteers from PASUM, KK11 and KK12 to test selected non-classroom spaces at different hours. Recruit across different devices and networks; log failed tests and missing locations as well as successful ones. Avoid encouraging repeated data-intensive tests in congested halls or on metered plans.

**Phase 3 — Evaluate and iterate.** Compare the tool's study-spot guidance with independent follow-up measurements at the same locations and times. Ask students whether it reduced unnecessary walks, and ask campus stakeholders whether the aggregated evidence helps prioritize investigation. Only expand to other buildings once data quality and privacy safeguards hold up.

| Pilot measure | What success would look like | Caution |
| --- | --- | --- |
| Data completeness | A meaningful share of consented tests include a usable approximate location, timestamp and network label | Report missing and failed tests too; do not invent a coverage denominator |
| Repeatability | Spots recommended as strong are supported by repeated tests on multiple days | Re-test to detect false recommendations and time-of-day variation |
| Student utility | Students report that the map helps them choose a workable place with less searching | Use a short before/after survey; treat self-report as self-report |
| Equity insight | Recurrent underserved areas can be identified with sample counts and uncertainty | Never infer an individual's circumstances or publish precise personal routes |
| Operational value | Student representatives and IT can review aggregate patterns and investigate candidates | Investigation—not an automatic diagnosis or guaranteed cost saving |

These are **evaluation criteria**, not current outcomes or promised numerical targets.

## Sustainability and responsible scale

The student-facing utility should remain free. After a validated pilot, a potential sustainability path is an **opt-in institutional analytics service**: aggregated, privacy-protective trends for facilities and network teams, without selling individual locations or personal histories. Its viability and pricing have **not** been validated. Before any such partnership, the project would need clear governance, appropriate permissions, minimum sample thresholds, retention controls and a security review.

A second campus could reuse the measurement and visualization framework but would need its own curated places, local partners, data-quality checks and privacy review. More map pins alone do not demonstrate impact.

## The ask for PITRAM

We are seeking feedback, mentorship and an opportunity to run a **small, consent-based campus pilot**. We would particularly value support in user research, data governance and introductions to appropriate student and campus infrastructure stakeholders. The immediate goal is not to declare the network “fixed”; it is to establish whether students can save time and whether evidence of unequal access can be made more actionable.

---

## Three-minute spoken pitch

> Think of the last time you had a deadline and your internet failed. You found a place to sit, opened your laptop, and watched the upload wheel spin. Should you move to another floor? Switch to mobile data? Wait until the lecture ends? Most students have no evidence to make that decision.
>
> That uncertainty is the problem HiFiPulse addresses. Campus Wi-Fi is often described as simply available or unavailable. But what matters to a student is whether a connection works **here, on this network, at this time**. And when the fallback is paid mobile data, unequal access becomes a student equity issue—not just a technical inconvenience.
>
> HiFiPulse is a crowdsourced connectivity tool for campus life. Our prototype starts at Universiti Malaya, around PASUM, KK11 and KK12. A student chooses the network they are actually using, searches for a study location and runs an opt-in speed test. We record download, upload, latency and an approximate location. On the map, students can inspect past measurements, compare times of day and see how many tests support a result.
>
> But the aim is not to make a prettier speed-test map. A student looking for a study space can compare cafés, library areas and study cubes. We label a place as consistently good only when repeated nearby measurements support it. We do not claim to know whether seats are free. Students can also flag a dead zone, clearly marked as an **unverified report**, and use our guide to tell Wi-Fi congestion from weak cellular reception or an upstream outage.
>
> We have built the browser prototype. What we have **not** built yet is a verified campus-wide dataset or a shared system for study suggestions and dead-zone reports. Our next step is a small, privacy-conscious pilot: validate the data pipeline, invite volunteer testers across several locations and times, re-check recommendations, and ask students whether the tool actually saves them time.
>
> Our mission has three parts: improve digital equity, help students find workable places to study, and build connectivity literacy. If the pilot succeeds, anonymized aggregate trends could help student representatives and campus IT identify where to investigate and prioritize improvements. We are not asking anyone to believe a map on sight. We are asking for the chance to test whether better evidence can lead to better access.
>
> HiFiPulse: find a better place to connect, and make the places that still fail impossible to overlook. Thank you.

## Demo sequence for judges (optional, ~60 seconds)

1. On **Speed test**, show the searchable location field and compulsory network choice. Explain that a real test uses data, so run one only if connectivity and time allow; otherwise use previously collected **real** measurements, not fabricated sample numbers.
2. On **Coverage map**, focus on PASUM, KK12 and KK11. Open a result popup and point out its timestamp and measurement; show filters and the historical views. If the community feed is unavailable, state clearly that only device-local results are visible.
3. Open **Study spaces** and explain the repeat-test threshold and lack of seat data. Show the difference between a measured point and an unverified dead-zone report. End with the **Wi-Fi guide** and the pilot ask.

## Short application blurb (about 100 words)

HiFiPulse is a student-facing prototype that turns opt-in, location-aware network tests into practical campus insight. Starting around Universiti Malaya's PASUM, KK11 and KK12, students can explore approximate speed measurements, compare historical performance by place and time, and discover study spots supported by repeated evidence. A connectivity guide helps distinguish Wi-Fi congestion from cellular and upstream issues. Our goals are to improve digital equity, save time searching for a workable study space and increase awareness of network problems. We seek PITRAM support for a small, privacy-conscious pilot to validate data quality, student usefulness and the potential for aggregate insights to guide infrastructure decisions.
