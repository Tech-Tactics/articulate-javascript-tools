# Next-Button Gate Countdown

A reusable Storyline 360 JavaScript trigger that displays a live "Next enables in: M:SS" countdown on a time-gated slide and drives the time portion of the gate itself. The countdown runs on real wall-clock time, which makes the time gate immune to seekbar scrubbing.

**Script version:** 1.0.0
**README version:** 1.0.0
**Software:** Articulate Storyline 360 (v3.115.36688.0), HTML5 output

---

## Why this exists

Time-gated slides in this project originally satisfied their time requirement when the slide timeline reached its end ("Set time_met to True when the timeline ends"). In testing, the published seekbar in the LMS turned out to be draggable even when it was not draggable in Storyline's desktop preview. A learner could grab the seekbar and drag the playhead to the end of the timeline, firing the "timeline ends" event and satisfying the time gate in about one second.

This script closes that hole. It measures elapsed time using the browser's real clock rather than the slide timeline, so dragging the seekbar has no effect on the gate. As a side benefit, it gives the learner a clear, literal countdown instead of leaving them to guess why the Next button is disabled.

---

## What it does

- Reads the gate length (in seconds) from a Storyline Number variable, so one script works on every gated slide without editing the code.
- Writes a `M:SS` countdown to a Storyline Text variable once per second.
- When the countdown reaches zero, sets the Storyline True/False variable `time_met` to true. The slide's existing enable triggers (which require both `time_met` and the interaction-completion variables) then turn the Next button on.
- Does not touch the Next button directly and does not touch the interaction-completion variables. The trigger-based gate keeps full control of Next; this script only owns the time component and its visible countdown.

---

## Storyline variables

Create these in Manage Variables before adding the script:

| Variable | Type | Default | Role |
|---|---|---|---|
| `gateSeconds` | Number | 0 | Input. Set per slide to that slide's gate length in seconds. |
| `countdownText` | Text | (empty) | Output. The script writes the display string here. |
| `time_met` | True/False | False | Output. Set true when the countdown completes. Same variable the existing gate uses. |

---

## Per-slide setup

1. Add a trigger **above** the JavaScript trigger:
   *Set `gateSeconds` to [this slide's gate length] when the timeline starts on this slide.*
   Example: a 25-second gate sets `gateSeconds` to 25. Use the value from the per-slide gate recommendations.

2. Add a JavaScript trigger:
   *Execute JavaScript when the timeline starts on this slide* and paste the full contents of `next-gate-countdown.js`.

3. **Remove** the old trigger *Set `time_met` to True when the timeline ends* if it is present on the slide. The script now owns `time_met`. Leaving the old trigger in place would re-open the seekbar exploit, because scrubbing to the end would still fire the timeline-end event and set `time_met`.

4. Place a text box on the slide. With the default configuration (`includeLabel: false`), the text box should contain the label plus the variable:
   `Next enables in: %countdownText%`
   If you set `includeLabel: true` in the script's CONFIG block, the script supplies the full label and the text box should contain only `%countdownText%`.

5. Leave your existing enable triggers and reset triggers unchanged. The script integrates with them through `time_met`.

---

## Configuration

The script has a small CONFIG block at the top. No per-slide edits are needed; these are project-wide preferences.

| Setting | Default | Purpose |
|---|---|---|
| `varGateSeconds` | `"gateSeconds"` | Name of the input duration variable. |
| `varCountdownText` | `"countdownText"` | Name of the output display variable. |
| `varTimeMet` | `"time_met"` | Name of the gate variable the script sets. |
| `includeLabel` | `false` | If true, the script writes the full "Next enables in: 0:25" label. If false, it writes only "0:25" and you supply the label in the text box. |
| `readyMessage` | `"You may now continue."` | Shown when the countdown reaches zero. |
| `labelPrefix` | `"Next enables in: "` | Used only when `includeLabel` is true. |

---

## Behavior notes

**Seekbar.** Because the gate is now driven by wall-clock time, the seekbar can be left visible or removed; scrubbing no longer affects the gate either way. Removing it on gated slides is still reasonable to avoid learner confusion, but it is no longer required to close the exploit.

**Background tabs.** Browsers throttle timers in background tabs, so the on-screen number may update less frequently when the learner switches away. The script reads true elapsed time on each tick, so the displayed value stays accurate; it may visibly jump to the correct remaining time when the tab regains focus rather than ticking smoothly.

**Single-timer safety.** The interval handle is stored on `window.__nextGateInterval`. Re-running the script on a slide revisit clears any prior interval first, so only one countdown ever runs at a time.

**Fail-open.** If `gateSeconds` is missing, zero, or non-numeric, the script clears the display and sets `time_met` to true immediately, so a misconfigured slide does not trap the learner behind a Next button that never enables.

---

## What this script does not do

- It does not enable the Next button. The existing trigger-based gate does that, using `time_met` together with the interaction-completion variables.
- It does not track whether the learner clicked all flip cards or interactive objects. Those remain handled by the slide's existing layer triggers.
- It does not read the slide's timeline duration directly. Reading timeline length from JavaScript requires Storyline's undocumented internals, which can break between versions; the script reads the `gateSeconds` variable instead so it stays stable across Storyline updates.

---

## Changelog

### Script

**1.0.0** (2026-05-21)
Initial release. Wall-clock countdown that drives `time_met` and writes a `M:SS` display to `countdownText`.

### README

**1.0.0** (2026-05-21)
Initial documentation.
