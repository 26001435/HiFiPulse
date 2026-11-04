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

---

# Expanded PITRAM 2027 pitch: HiFiPulse — Evidence-First Wi-Fi for Lecture Halls

> **Find the problem with data first. Fix it in order of cost. Make unequal access visible.**

*Pertandingan Inovasi PASUM 2027 (pre-selection for PITRAM 2027) · Category A: Student, Science & Technology*

**Status note:** This is a project proposal, not a report of finished results. Each component is labelled **Built**, **Prototype**, or **Planned**. No coverage, usage, savings or improvement figures are claimed. Results will be added only after they are measured. This expanded framing supplements, rather than replaces, the earlier HiFiPulse proposal and spoken pitch above.

## 1. The problem

Campus Wi-Fi is usually described as a single fact: “Wi-Fi is available.” For students, that is not enough.

- Lecture halls are where students depend most on the network, and where it is least understood.
- Performance varies by **seat, crowd size, time of day and network**, but this is rarely measured at that level. Browser GPS alone cannot establish an exact seat or floor; the proposed hall study uses fixed positions and self-reported context instead.
- When the connection fails, students with spare mobile data can work around it. Students without it cannot. This makes poor connectivity an **equity** issue, not only a technical one.
- Campus decision-makers often lack student-experience evidence at the level of a room, area or time slot, so money may be spent on the wrong fix.

## 2. Thesis: diagnose before buying

**Before spending on new hardware, use inexpensive data to find out what is actually wrong with a lecture hall, then fix it in order of cost.**

Wi-Fi in a hall can fail for different reasons: signal attenuation by a crowd, access-point placement, competition for airtime, upstream limits or heavy content. These need different responses. Measurements help distinguish them, but a browser speed test alone cannot prove the cause; the proposed hall experiment adds RSSI, headcounts and controlled positions.

### The cost ladder

| Step | What it is | Relative cost | Component |
| --- | --- | --- | --- |
| **1. Measure** | Opt-in tests and, if permitted, fixed-position sensor readings by place, time and occupancy | Near zero for the browser prototype; sensor costs to be measured | HiFiPulse; proposed beacons |
| **2. Explain** | Separate signal attenuation, access-point placement, congestion and upstream limits | Low analysis cost | Proposed crowd attenuation study |
| **3. Free fixes** | Better seating guidance, timing of heavy downloads, lighter course files and offline preparation | No new hardware; staff and volunteer time still counts | HiFiPulse guidance and task planner |
| **4. Cheap physical fixes** | Test a reflector panel; optionally trial approved offline content at a weak spot | Low relative to capital work, subject to measured parts and labour | Proposed reflector and optional OfflineNode |
| **5. Capital upgrades** | More access points, cabling or backhaul improvements where evidence indicates they are needed | High | Handed to campus IT with evidence |

We aim to test reasonable steps 1–4 before recommending step 5, **not** to delay a necessary safety-critical or institutional repair. Each trial will record parts, energy and volunteer hours so “low-cost” is demonstrated rather than assumed. Campus IT retains authority over infrastructure decisions.

## 3. Components

### 3.1 HiFiPulse: measurement and evidence layer

**Status: Built (browser prototype); verified shared data operation remains a pilot task.**

A student-facing, opt-in, crowdsourced connectivity tool.

- Runs a browser test of download, upload, ping and jitter after the student chooses a network and place. Students can choose a lighter or heavier data budget; an incomplete measurement is kept separate from a measured 0 Mbps result.
- Lets a student report a place and optional floor, such as **KK12 Blok A L4**. These labels are self-reported; the browser checks obvious PASUM/KK11/KK12 GPS contradictions but cannot verify a building, room, seat or floor.
- Rounds geolocation to roughly 110 m before submission, if permitted. It estimates test data use and does not run silent background tests.
- Displays approximate, sometimes grouped, map observations around PASUM, KK11 and KK12. The map has time filters, day-by-day speed history and an individual-test sidebar; the separate Rankings page shows hourly averages and study spaces.
- Treats **place × network × time × evidence count** as the core unit of value, rather than a campus-wide average. Repeated nearby observations across multiple days are required for a “consistently good” study-space label; no seat availability is claimed.
- Marks assessment-ready **candidates** using repeated observations of upload, ping, jitter and incomplete attempts, with explicit thresholds and sample counts. A failed test is a proxy for instability, **not** a measurement of continuous dropouts. The label is not a guarantee that an online assessment will work.
- Offers a rule-based task planner for quizzes, report uploads, video and offline reading. It suggests a spot or historically steadier hour **only when enough observations exist**; it does not certify an off-peak period or predict the future. Tasks stay in the browser tab and are not submitted.
- Separates unverified, user-reported dead zones from measured results and includes a guide to distinguish weak Wi-Fi, cellular reception, congestion and upstream problems.

**Not yet verified or complete:** the external write/read pipeline, provider/floor/status persistence in the published feed, a published privacy notice and retention policy, shared cross-device suggestions and dead-zone reports, verified participation figures, and validation of assessment or task recommendations. The site can show device-local results when the shared feed is delayed or unavailable. No production readiness or campus partnership is implied.

### 3.2 Crowd attenuation study: explanation layer

**Status: Planned**

**Question:** In one UM lecture hall, how do signal strength and performance change as the room fills, and does the effect differ by seat position?

**Background:** Human bodies contain water and can absorb and scatter Wi-Fi signals. A full room also means more devices competing for airtime. The study will measure signal strength (RSSI) and performance (latency and throughput) separately rather than treating a lower speed as proof of body absorption.

**Method:**

- One hall, one target access point, five fixed positions: front, middle, back, near the AP and far from the AP.
- Three to five ESP32 boards log RSSI of that AP every 10–30 seconds. A laptop runs repeated ping probes and a small, consented throughput test every 15 minutes.
- Record headcounts by hand or an approved attendance figure every 10–15 minutes; **no cameras** or device-identifier collection.
- At least four sessions at the same weekday and time, covering low and high occupancy, with occupancy bands defined before collection.
- Analyse mean RSSI, ping and throughput per position and occupancy band in a spreadsheet. Plot trends and publish counts and spread alongside any slope.

**Limits:** A standard ESP32 scans 2.4 GHz, so this cannot automatically explain a 5 GHz client’s experience. Doors, access-point load and nearby networks are logged as confounders. Findings apply to **this hall across N sessions**; small or null effects will be reported honestly. IT and lecturer permission are prerequisites.

### 3.3 Self-powered beacons: sensing infrastructure

**Status: Planned (bench prototype first)**

Small ESP32-based sensors at approved fixed positions would wake periodically, scan only a target AP, log RSSI and time, then sleep. This would reduce reliance on students running tests and add longitudinal samples by hour and day, at the **actual sampling interval**, not continuous connectivity monitoring.

**Power idea:** Indoor light from a small solar cell and supercapacitor may support a very low duty cycle. A thermoelectric module on a warm router is only an optional heat-harvesting demonstration.

**Honest power budget:** Indoor light may yield only a few tenths of a milliwatt from a small panel, and router heat harvesting may yield milliwatts at best. One scan every 15–30 minutes might be feasible but is **unverified**. Measure actual sleep, wake and transmission energy with a multimeter before claiming battery-free operation; a buffer battery or larger panel may be necessary.

**Privacy:** Beacons would log only the target AP’s name and signal, never identifiers such as other devices’ MAC addresses. Placement and collection require IT/facilities permission.

### 3.4 Steerable reflector: cheap physical response

**Status: Planned (small-room test first)**

A foil-backed, servo-positioned panel could redirect some Wi-Fi energy toward a measured weak area. HiFiPulse would help choose **where to investigate**; a one-off calibration sweep, not live tracking, would select any useful angle.

**Method:**

1. Record baseline RSSI and throughput at two to three weak positions.
2. Step through several angles, taking repeated measurements at each, plus a no-reflector control.
3. Check other seats as well: improvement in one corner can degrade another.
4. Compare an evidence-informed placement against a random placement, recording side effects and uncertainty.

**Honest physics:** At 2.4 GHz the wavelength is about 12.5 cm, so a useful panel would likely need to be several wavelengths across—roughly half a metre or more. An effect may be modest, only a few dB, or zero. The servo’s energy draw is much higher than a sleeping beacon’s; the whole system will **not** be described as energy-harvested without measurements. Lecturer and facilities approval are mandatory before a hall trial.

### 3.5 OfflineNode: optional stopgap

**Status: Planned**

A Raspberry Pi could serve lecturer-approved static course files on its own local hotspot at a measured weak location. Students could fetch readings without relying on the campus internet link. It cannot deliver live classes or online submissions and is **not** a substitute for infrastructure repair. Any trial requires UM IT permission, lecturer/content rights and a security review.

## 4. Experiments summary

| Issue | Solution tested | Experiment | What counts as a result |
| --- | --- | --- | --- |
| Students cannot tell which spots are reliable | Repeated-observation study and assessment-ready candidate labels | Re-test labelled spots at different times and days, including failed tests | Fraction of recommendations that hold up; false positives and sample counts |
| Students struggle to time connectivity-heavy work | Rule-based task planner | Compare its suggested places/hours with independent follow-up tests and a short student usability study | Task completion and usefulness **measured in the pilot**, including failed suggestions |
| Crowded halls degrade a connection | Crowd attenuation study | Hall experiment in Section 3.2 | RSSI, ping and throughput slopes against headcount by fixed position, with uncertainty |
| A particular seat has a weak signal | Steerable reflector | Controlled angle sweep and before/after controls in Section 3.4 | Change in RSSI and throughput, counts and negative side effects elsewhere |
| Sensors depend on wiring or batteries | Self-powered beacon | Harvested-energy endurance test | Days operating at a stated reporting interval and measured energy budget |
| Dead zones obstruct static coursework | Optional OfflineNode | Compare access to an approved file over campus Wi-Fi and the local node | Download time, success rate and participant count, not online-submission performance |

**Design rules:** Set success measures before collection; keep place, weekday/time and seat positions consistent; log bad and failed results; report sample sizes; claim only “in this location, across N tests.” The browser’s approximate map cannot itself establish which seat or floor caused a signal change.

**Priority if time is limited:** (1) independent re-test validation, (2) the hall attenuation study, (3) a small-room reflector sweep. Beacon endurance and OfflineNode follow only if resources and permission allow.

## 5. Equity

Equity is a measurable question, not a slogan. The pilot would compare measured gaps between positions and circumstances—for example, whether back rows become less usable when a hall is full—and ask whether a paid mobile-data fallback is available **without recording individual students’ financial circumstances or publishing personal routes**. Any “X” or percentage would be filled in only after ethical, consented measurement. Offline materials and institutional fixes matter because students cannot all pay to work around a weak connection.

The related goals are **SDG 4 (Quality Education), SDG 9 (Industry, Innovation and Infrastructure) and SDG 10 (Reduced Inequalities)**. A prototype does not, by itself, achieve those goals.

## 6. Originality, stated honestly

Crowdsourced speed maps, ESP32 sensors, energy harvesting and passive reflectors each already exist. The proposed contribution is their **cost-ordered combination in a UM lecture-hall pilot**:

- Evidence counted by place, network and time, rather than a single campus-wide average.
- A **measure → explain → cheap fix → verify** loop that checks its own recommendations.
- Upload/jitter/failure-aware assessment candidates and a task planner, rather than ranking speed alone. These are modest, rule-based extensions—not AI or a claim of new radio physics.
- A deliberate test of inexpensive responses before capital upgrades, with actual parts and labour costs recorded.
- Equity treated as an observable difference in access, not as proof from a colourful map.

## 7. Risks and limits

- **Permissions:** IT, lecturers and facilities must approve any sensor, reflector or local node in a hall.
- **Data quality:** RSSI is noisy; occupancy and congestion can be confounded; browser GPS and self-reported floors cannot verify seats. Failed tests may be missing from the shared feed.
- **Scope:** One or two halls do not establish a campus-wide effect. The outcome is a transferable method, not proof of universal coverage.
- **Costs and physical results:** “Low-cost,” energy-harvested and signal-improvement claims require actual measurements, not component descriptions.
- **Privacy:** Opt-in browser tests, approximate map positions, no cameras or identifiers of other devices, and a published retention and moderation policy before wider use.
- **Assessment safety:** Do not tell students to rely on a historical score as an exam guarantee. Encourage a pre-assessment check, saved work and lecturer-approved contingencies.

## 8. Pilot plan

1. **Phase 1 — Responsible data collection.** Verify the shared data pipeline, including provider, floor, ping, jitter, upload and incomplete-test fields; publish a privacy notice; set retention and moderation rules. Define hall positions, repeat-test thresholds and outcome measures before collecting results.
2. **Phase 2 — Hall study and low-cost trials.** Run the crowd attenuation sessions with consent and permissions. Bench-test beacon power and try the reflector sweep in a small room before any hall intervention. OfflineNode remains optional.
3. **Phase 3 — Independent evaluation.** Re-test study and assessment candidates, compare before/after at the same positions, ask students whether guidance helped, and ask IT whether aggregated evidence helped prioritise an investigation. Record failures as well as improvements.

Evaluation criteria—not current outcomes—include **data completeness, repeatability, student usefulness, equity insight, operational value and actual cost**.

## 9. The ask

Feedback, mentorship—especially in RF/antenna work and data governance—and an opportunity to run a **small, consent-based UM campus pilot**, with introductions to appropriate lecturers and UM IT/facilities contacts. We seek permission to test the method, not an endorsement of unmeasured improvements.

## 10. Team and contact

- **Team:** *(add names, roles and mentor)*
- **Contact:** *(add)*

### Optional 30-second bridge to the existing spoken pitch

> HiFiPulse already gives students an approximate way to record and compare connectivity. For PITRAM 2027, the bigger idea is **evidence-first Wi-Fi for lecture halls**: measure where and when a hall fails, explain whether the problem is signal, crowd load or upstream capacity, test free and low-cost responses, and only then recommend expensive upgrades. Assessment-ready candidates and a task planner make the evidence useful to students now; fixed-position sensors and controlled experiments would test why those patterns occur. We will report what works, what fails, what it costs and whom poor connectivity affects—without claiming results before the pilot.

---

# EUREKA@KK12 supplement — WaveLens (proposed)

> **Status and scope (read before presenting):** This is an EUREKA-specific *proposal variant*, not a claim that a Fresnel zone plate has been built, tested or shown to improve Wi-Fi. The repository does not contain prototype photographs, a bill of materials, controlled RF measurements or permission to install anything at UM. The existing PITRAM proposal, Section 3.4 reflector study and spoken pitch above remain intact as the original version. Use this supplement for EUREKA **only after** checking the competition's actual category rules, making a safe physical prototype, and replacing any conditional statements with documented observations. Do not advertise a price, gain, throughput improvement or category eligibility as established.

## Why add a physical prototype?

HiFiPulse already offers an opt-in browser measurement and evidence interface, but the proposed sensor, reflector and OfflineNode components above remain unbuilt. An independently made passive ring-aperture demonstrator, tentatively called **WaveLens**, could make the proposal tangible and connect it to Asasi wave optics. The EUREKA narrative is a **hypothesis to test**, not a completed loop:

**HiFiPulse observes a repeat weak spot → investigate the cause → try a permitted passive plate *if appropriate* → re-measure at the same conditions and nearby seats → report gains, null results and losses.** A browser download speed alone cannot diagnose poor RF signal or prove a plate caused a change. If the bottleneck is congestion or backhaul, the plate is unlikely to fix it. The original cost ladder still applies; WaveLens is an *alternative planned physical trial* to the steerable reflector, not an additional deployed campus feature.

**Entry category:** Product Innovation / Category B is a *suggested* EUREKA route, subject to the organiser's current rules and eligibility. Do not claim acceptance or endorsement.

## Proposed component 3.4 alternative: Fresnel zone plate

**Status: Proposed design; fabrication and RF validation not evidenced in this repository.** A cardboard panel with alternating foil-covered and open concentric zones is a *binary amplitude* zone plate: the foil blocks/transforms incident transmission rather than actively amplifying it. Open zones contribute fields with more favourable phase at a specified focus; closed zones suppress some out-of-phase contributions. Energy is redistributed, so other directions may worsen. In a real Wi-Fi room, the source is not necessarily a plane wave, multipath and polarisation matter, and a metal sheet may also reflect or detune nearby equipment. A simple cardboard mock-up would demonstrate geometry, **not** measured radio gain.

**Candidate calculation for 5.18 GHz (nominal channel 36):** λ = c/f ≈ **5.79 cm**. The familiar paraxial formula **rₙ ≈ √(nλf)** assumes a plane incident wave and a small-angle approximation. For a plane wave focused **f = 15 cm behind the plate**, the exact on-axis path-difference boundary is **rₙ = √(nλf + (nλ/2)²)**: the edge-to-axis path difference is nλ/2. Alternating half-wave zones are open/blocked, so contributions from consecutive *open* zones differ by about one full wavelength. Do not call the radial ring spacing “a quarter wavelength”; it varies with radius. At this short focal length and wide aperture, the small-angle approximation is **not sufficiently accurate to cut a finished template**.

| Boundary n | Paraxial radius √(nλf) | Plane-wave exact radius | Why it matters |
| --- | ---: | ---: | --- |
| 1 | 9.3 cm | **9.8 cm** | First half-wave zone |
| 2 | 13.2 cm | **14.4 cm** | Second boundary |
| 3 | 16.1 cm | **18.3 cm** | Third boundary |
| 4 | 18.6 cm | **21.9 cm** | Fourth boundary; exact outer diameter **≈43.9 cm**, not ≈37 cm |

Four zones here means two open and two blocked, with the choice of which zone opens documented. **These radii apply only to the stated plane-wave/15 cm image-distance model.** They do **not** justify mounting a plate 15 cm from an access point to improve a distant study area. For a finite-distance source and receiver, compute the phase from the **sum of source→ring and ring→receiver paths**, then design a different zone pattern and verify it experimentally. A 15 cm focal distance would put the intended plane-wave focus near the plate, not a laptop a metre away. Obtain a basic RF/antenna review before publishing a printable template or positioning anything near an AP.

| Practical claim | What can currently be said |
| --- | --- |
| Materials | Recycled cardboard, aluminium foil and adhesive are *proposed*; document actual construction and safety. |
| Cost | “Under RM5” / “RM3.50” is a **target**, not a measured bill of materials. Include stand, consumables and labour if comparing with infrastructure costs. |
| Electrical power | The passive plate has no powered electronics; the router/hotspot and laptop still consume power. |
| Gain or speed | **Unknown.** +3 to +5 dB, 2–3× on-axis power and 50–80% faster throughput are *not observed results* and must not be promised. Power ratio in dB is not a throughput prediction. |
| Channel / source | A consumer phone hotspot may not expose or stay on channel 36. Confirm actual frequency and channel with a permitted diagnostic; otherwise document the channel used and recalculate. |

### Revised cost ladder for the EUREKA variant (proposed)

| Step | Response | Status and cost |
| --- | --- | --- |
| 1. Measure | Opt-in HiFiPulse tests by approximate place, time and self-reported network | **Browser prototype exists**; shared feed operation and data quality still need checking. |
| 2. Explain | Separate weak RF signal, crowd/load, AP placement and upstream limits using controlled observations | **Proposed hall study**; a speed reading alone cannot do this. |
| 3. Try no-new-hardware responses | Timing, saved/offline preparation, approved lighter course material and study guidance | Guidance and rule-based planner exist; efficacy and staff time have not been evaluated. |
| 4. Trial a passive plate | Bench-test WaveLens against no plate, a plain cardboard/foil control and off-axis locations | **Unbuilt/unvalidated here**; sub-RM5 parts cost is a target, not a demonstrated campus fix. |
| 5. Escalate | AP, cabling or backhaul investigation where evidence warrants | UM IT's decision; do not delay necessary infrastructure repair. |

### Controlled experiment, not a staged improvement

1. **Before the expo:** confirm a controllable source and actual channel, get approval for the space and radio equipment, build and photograph the plate and a same-size plain control, and measure its real parts cost. Never attach anything to an institutional AP without written permission.
2. **Bench geometry first:** place source, plate and receiving device at documented fixed distances; derive zones for that geometry. Check receive-side RSSI/signal metrics separately from HiFiPulse ping, download and upload; the browser cannot read RSSI reliably. Do not interpret a faster internet test as proof of diffraction.
3. **Alternate baseline / plate / control** in a predeclared order over repeated sessions. Keep source channel, device, position, test profile, time window and load as constant as possible. Include adjacent/off-axis positions and record failures. Keep metered-data use modest; a local test endpoint may be preferable for controlled throughput, with permissions.
4. Report sample counts, variability, channel, exact geometry, raw before/after data, any nearby losses, measured cost and uncertainty. A null or negative result is a valid outcome. If the plate only demonstrates the optical principle but does not improve Wi-Fi, present it honestly as a teaching demonstrator, **not** a network fix.
5. Only if a controlled result survives repeats and a safety/permissions review should a small KK12 trial even be proposed. No claim of campus deployment or B40/rural scalability follows from one desk test.

**Experiment-table replacement for this EUREKA variant:** measured weak spot → *proposed* Fresnel zone plate → repeated before/after/control RSSI and throughput at the intended focus **and adjacent positions** → report effect size, spread, null results and side effects. This is an alternate row to the original reflector experiment in Section 4, which remains part of the PITRAM version.

## Asasi physics explanation for judges

- **Diffraction and interference:** open concentric apertures contribute fields that superpose. Alternating half-wave *path-difference* zones can favour a particular focus. A metal-backed zone plate also reflects; its actual radio response must be measured.
- **Young's double slit:** a useful analogy for coherent superposition, but a finite multi-ring plate in an indoor multipath Wi-Fi environment is not the same two-slit experiment.
- **Newton's rings:** both show concentric geometry related to path differences. Newton's rings come from interference in a curved thin air film under reflected/transmitted illumination; they are **not** evidence that this plate focuses Wi-Fi.
- **Thin-film interference:** another superposition analogy. The quarter-wave *optical thickness* used for some coatings is **not** the radial spacing of these zones; zone boundaries follow successive half-wave path differences.

**Short honest phrase:** “We are applying the idea of controlled path differences and superposition to a proposed 5 GHz aperture. The geometry is calculable; its usefulness in a real Wi-Fi room still needs measured proof.”

## Conditional three-minute EUREKA booth pitch (rehearsal version)

> Think of trying to submit coursework while your connection stalls. Would you move, wait or pay for mobile data? The answer is not simply whether Wi-Fi exists. What matters is the network, the place, the time and how many observations support a claim.
>
> Our HiFiPulse browser prototype lets students opt in to a test, choose their network and approximate location, and examine past results near PASUM, KK11 and KK12. Its map shows observed areas, not verified coverage, and study-space guidance needs repeat tests. Shared publication depends on an external data service, which we must verify before claiming cross-device results.
>
> For this EUREKA variant, we are exploring a physical companion called WaveLens. **[Hold up a plate only if one has actually been built; otherwise show the drawing.]** Alternating open and foil-covered rings form a Fresnel zone plate. In a simple wave model, waves from selected zones can arrive more nearly in phase at a chosen focus; the blocked zones reduce contributions that would cancel. This illustrates diffraction and interference from our Asasi physics syllabus.
>
> The important question is not whether the rings look convincing: does this particular plate help a real connection, where a student actually sits, without making nearby seats worse? Our proposed test compares a baseline, the plate and a same-size control at fixed positions and channel, repeating RSSI and throughput measurements. A browser speed test tells us about a connection; it does **not** by itself identify the RF cause.
>
> **[If a controlled before/after dataset exists, show its actual figures and uncertainty. If not, say:]** We have not yet demonstrated a Wi-Fi improvement. The physical design and cost are testable hypotheses, not a substitute for campus IT. If the effect is absent, we will report that too.
>
> The bigger idea remains: measure a gap responsibly, understand the cause, try the least costly appropriate response and verify it. Students should not have to pay for mobile data to work around an avoidable problem. HiFiPulse makes the evidence visible; WaveLens is a proposed physics-based experiment we must earn the right to call a fix.

This pitch deliberately does **not** replace the existing PITRAM spoken pitch, invent a booth result or promise an improvement. Edit its prototype sentence only when a real built object is available and documented.

## 90-second live-demo plan and fallback

- **Before judges:** check the competition rules, available internet, hotspot's *actual* channel and device data budget. Photograph the real build, verify dimensions and costs, and prepare a tested local display or pre-recorded **actual** measurements. A phone may not allow channel locking; never promise channel 36 without checking.
- **At the booth:** show one current HiFiPulse reading, the physical plate or drawing and the phase/path-length sketch. If geometry, network conditions and time allow, run a second reading with the plate and control at the **precalculated** positions. Report the actual values and note that two readings in a busy hall cannot establish a causal effect.
- **If the hall is noisy:** show only dated, genuine controlled results **if such results were collected**; otherwise show the protocol and say the effect remains unmeasured. Never invent “yesterday's KK12 test,” 12→18 Mbps, a 50% increase or +3 dB to fill a slide.
- **Bring:** the *real* built plate (if any), an uncut design drawing, documented dimensions and materials, a laptop, a permitted source and power bank, a poster with equations and limitations, and an optional one-page handout. Do not print a gain chart until measurements exist.

## Originality and access, with appropriate limits

The inventive question is whether a **data-guided passive diffractive intervention** can outperform a simple control at a useful position, with documented cost and side effects. Fresnel plates, cardboard foil prototypes and crowdsourced speed maps already exist individually; no new wave physics is claimed. A printable design **could** be inexpensive and accessible, including to low-income communities, *if* validated for a repeatable geometry and real environment. B40 or rural benefit, JENDELA alignment, low-cost superiority and institutional savings are potential research questions, not proven impacts or endorsements.

## Future work — after the pilot (written-proposal only)

First verify the shared HiFiPulse feed and independently test WaveLens with fixed positions, a control, permissions and off-axis checks. No working plate or Wi-Fi improvement is documented here. Only after that pilot might three connected studies be worth pursuing:

1. **Occupancy-aware diagnostics.** The proposed hall study uses consented manual headcounts. Compatible Wi-Fi channel-state sensing could examine crowd-related changes without cameras, but needs supported drivers/hardware, careful validation against other causes, privacy safeguards and UM IT oversight. A browser test or off-the-shelf AX210 alone cannot deliver it.
2. **Assisted connectivity in reported dead zones.** Current reports are unverified and cannot relay traffic. Opt-in local sharing would need secure routing, user and operator permission, MCMC/legal review, and data, battery and cost limits. It must not shift infrastructure costs to students with paid mobile plans.
3. **Evidence-informed network planning.** Aggregated place × network × time counts might help campus IT investigate access-point or mesh placement. This needs a verified feed, minimum sample thresholds, privacy-preserving export and IT collaboration; browser observations alone cannot establish a topology or savings.

These are **research possibilities, not current capabilities or a delivery promise**. Timing depends on pilot results, partners and approvals. Keep them out of the abstract, booth pitch and poster so the actual prototype and validation remain central.
