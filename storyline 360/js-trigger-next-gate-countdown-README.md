# JavaScript Trigger Next-Gate Countdown in Storyline

**Author:** Joseph Black
**Version:** 1.0.0
**Date:** 2026-05-21
**Tested with:** Articulate Storyline 360 x64 v3.116.36838.0

## What It Does

Displays a live `M:SS` countdown showing how long until the Next button becomes available on a time-gated slide. The countdown is measured on the browser's real (wall-clock) time rather than the slide timeline, so it cannot be shortened by dragging the seekbar to the end of the timeline.

When `setTimeMet` is enabled (default), the script also drives the time portion of the gate: it sets the Storyline variable `time_met` to true when the countdown reaches zero. The slide's existing enable triggers (which require both `time_met` and the interaction-completion variables) then turn the Next button on.

The script computes the display string and writes it to a Text variable; an on-slide text box references that variable. Look-and-feel stays under Storyline's control rather than being hardcoded in JavaScript.

## How It Works

1. On slide load, the script reads `waitTime` (the gate length in seconds for that slide).
2. It records the current wall-clock time as the start point.
3. Once per second it recomputes elapsed time, derives the remaining seconds, and writes a `M:SS` string to `timeLeft`.
4. When the remaining time hits zero, it writes the ready message to `timeLeft` and — if `setTimeMet` is true — sets `time_met` to true, then stops its interval.
5. A single interval handle is stored on `window.jbGateCountdown`; re-running the script on a revisit clears the prior interval first, so only one countdown ever runs.

## Storyline Variables

| Variable | Type | Default | Role |
|---|---|---|---|
| `waitTime` | Number | 0 | Input. Set per slide to that slide's gate length in seconds. |
| `timeLeft` | Text | (empty) | Output. The script writes the display string here. |
| `time_met` | True/False | False | Output. Set true at zero when `setTimeMet` is true. Same variable the existing gate uses. |

## Setup

1. Create the three variables above in **Manage Variables**.
2. On each gated slide, add a trigger **above** the JavaScript trigger:
   **Adjust Variable** → set `waitTime` to that slide's gate length when the timeline starts. (Pull the value from the per-slide gate recommendations.)
3. Add a trigger: **Execute JavaScript** when the timeline starts on this slide → paste the contents of `js-trigger-next-gate-countdown.js`.
4. If `setTimeMet` is true, **remove** any existing trigger that sets `time_met` to true when the timeline ends. The script now owns `time_met`; leaving the old trigger in place would re-open the seekbar exploit, because scrubbing to the end would still fire the timeline-end event.
5. Place a text box (on the slide or a master) containing: `Next enables in: %timeLeft%`
6. Leave the slide's reset triggers and enable triggers unchanged. The script integrates through `time_met`.

## Customization

All configurable values are at the top of the script:

| Variable | Default | Description |
|---|---|---|
| `waitTimeVar` | `"waitTime"` | Name of the input duration variable |
| `timeLeftVar` | `"timeLeft"` | Name of the output display variable |
| `timeMetVar` | `"time_met"` | Name of the gate flag variable |
| `setTimeMet` | `true` | If true, sets `time_met` at zero. Set false for a display-only countdown. |
| `readyMessage` | `"You may now continue."` | Shown when the countdown reaches zero |

## Display-Only Mode

If the seekbar is removed on gated slides (which closes the scrubbing exploit on its own) and the time gate is handled by the original "Set time_met when timeline ends" trigger, set `setTimeMet` to `false`. The script then provides only the visible countdown and does not touch `time_met`.

## Notes

- **Seekbar:** Because the gate (when `setTimeMet` is true) is driven by wall-clock time, the seekbar can be left visible or removed; scrubbing does not affect the gate either way.
- **Background tabs:** Browsers throttle timers in background tabs, so the on-screen number may update less often when the learner switches away. The script reads true elapsed time on each tick, so the value stays accurate — it may visibly jump to the correct remaining time when the tab regains focus rather than ticking smoothly.
- **Fail-open:** If `waitTime` is missing, zero, or non-numeric, the script clears the display and (when `setTimeMet` is true) sets `time_met` to true immediately, so a misconfigured slide never traps the learner.
- **Does not enable Next directly.** The trigger-based gate controls the Next button using `time_met` together with the interaction-completion variables. This script owns only the time component and its display.

## Changelog

| Version | Date | Changes |
|---|---|---|
| 1.0.0 | 2026-05-21 | Initial release. Wall-clock countdown; writes `M:SS` to `timeLeft` and sets `time_met` at zero when `setTimeMet` is true. |
