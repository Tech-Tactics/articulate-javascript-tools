# JavaScript Trigger Player Header in Storyline

**Author:** Joseph Black
**Version:** 2.0.1
**Date:** 2026-05-28
**Tested with:** Articulate Storyline 360 x64 v3.118.37003.0

## What It Does

Injects three optional indicators into the Storyline 360 course player's top bar, all rendered into the `links-right` container and sharing one persistent update loop:

1. **Course progress bar** — "Course Progress: XX%" text and a visual fill bar that changes color at 100%. Always on.
2. **Slide counter** — "Slide: X/Y" text. Hidden by default; enable with a single property change.
3. **Next-Gate countdown** — "Next enables in: M:SS" that tracks the current slide's timeline duration, hides itself on slides that don't need it, and switches to "You may now continue." when the Next button becomes enabled. Added in v2.0.0.

The progress bar eliminates the need for on-slide progress elements. The countdown gives learners a visible signal that a time-gated slide is timing rather than broken, while leaving the slide canvas free for content.

## File History

This script was previously named `js-trigger-progress-bar-slide-count`. It was renamed to `js-trigger-player-header` in v2.0.0 to reflect that it now manages multiple player-header indicators rather than just the progress bar.

## How It Works

1. On each slide load, the script checks whether the chrome DOM elements already exist in the player's `links-right` container.
2. If they don't exist (first slide), it creates the full widget: progress text, bar, slide counter (hidden), and countdown text (hidden).
3. If they do exist (subsequent slides), it updates the values in place.
4. A single `setInterval` runs every 500 ms via `window.jbCourseHeaderUpdater` to keep all three indicators in sync as variables and slide state change.
5. Two short `setTimeout` calls (150 ms and 400 ms) catch cases where Storyline's own scripts update variables slightly after the timeline starts.

## How the Countdown Behaves

The countdown runs inside the same 500 ms loop as the progress bar. On each tick it decides what to show based on three signals: the current slide's timeline duration, whether a Next button exists, and the Next button's `cs-disabled` class.

| Situation | Display |
|---|---|
| No Next button on this slide (knowledge check, certificate, etc.) | Hidden |
| Timeline duration shorter than `minSecondsToShow` (default 10 s) | Hidden |
| Next button is already enabled (first-visit complete, or revisit to a done slide) | "You may now continue." |
| Next still disabled and time still counting | "Next enables in: M:SS" |
| Next still disabled but time has elapsed (interactions still pending) | Hidden |
| `showCountdown` set to `false` | Hidden (feature off course-wide) |

The "Time elapsed but Next still disabled" rule handles slides with combined time + interaction gates. Once the time portion is satisfied, the countdown's job is done — the slide's own visual cues (unclicked flip cards, click-to-reveals) carry the message about what's left.

The "Next is enabled, show ready" rule handles revisits cleanly. On a return to a completed slide, Next is already enabled when the learner arrives, so the indicator shows "You may now continue." immediately instead of restarting a timer that's no longer gating anything.

## Setup

1. Open your Storyline project → **View → Slide Master** → select the **top-level master slide** (the parent, not a child layout).
2. Create a variable named `Progress` (capital P, case-sensitive).
3. Add a trigger: **Adjust Variable** → set `Progress` equal to `Menu.Progress` or `Project.Progress`.
4. Add a second trigger: **Execute JavaScript** → paste the contents of `js-trigger-player-header.js`.
5. If your player has no right-side buttons (Resources, Glossary, etc.), add a placeholder character (e.g. a period) to a player tab to keep the `links-right` container visible.

The countdown requires no per-slide variables to be created. It reads each slide's timeline duration automatically. Set the slide's timeline length to your intended gate length and the countdown matches it.

## Optional Countdown Variables

These are read by the countdown only and are entirely optional:

| Variable | Type | Purpose |
|---|---|---|
| `waitTime` | Number | Optional override or fallback for a specific slide's countdown length. Used as a fallback if the timeline duration read fails. With `waitTimeOverrides = true`, takes precedence over the timeline duration. |

You do not need to create or set `waitTime` for the countdown to work — the timeline duration is the default source.

## Customization

All configurable values are at the top of the script.

### Progress bar and slide counter

| Variable | Default | Description |
|---|---|---|
| `bgColor` | `#F6F9FB` | Track background color |
| `barColor` | `#FCCE4B` | Progress fill color |
| `compColor` | `#19BB32` | Fill color when progress reaches 100% |
| `borderRad` | `100px` | Border radius for rounded bar ends |
| `barWidth` | `220px` | Width of the progress bar |
| `barHeight` | `15px` | Height of the progress bar |
| `wrapperX` / `wrapperY` | `20px` / `0px` | Offset of the entire widget |
| `barX` | `200px` | Left offset of the bar from the wrapper |
| `slideTextX` | `440px` | Left offset of the slide counter (when visible) |

### Countdown

| Variable | Default | Description |
|---|---|---|
| `showCountdown` | `true` | Hard on/off for the countdown feature. Set `false` to suppress it course-wide while keeping the progress bar. |
| `waitTimeVar` | `"waitTime"` | Name of the optional fallback/override variable |
| `minSecondsToShow` | `10` | Slides with a timeline shorter than this won't show a countdown |
| `labelPrefix` | `"Next enables in: "` | Text before the timer |
| `readyMessage` | `"You may now continue."` | Shown when Next becomes enabled |
| `countdownX` | `440px` | Left offset of the countdown (shares default with the slide counter) |
| `countdownTextWidth` | `220px` | Width allowance for the countdown text |
| `waitTimeOverrides` | `false` | If `true`, a `waitTime` value greater than 0 overrides the slide's timeline duration. If `false`, `waitTime` is used only when the timeline read fails. |

## Slide Counter

The slide counter is hidden by default. To re-enable it, find the comment `/* Slide counter hidden (display:none) — change to "block" to re-enable */` in the script and change `display:none` to `display:block` in the `slideCounterText` style string on the line below it.

**Note:** the slide counter and the countdown share the same default left offset (`440px`). If you re-enable the slide counter while the countdown is also active, adjust either `slideTextX` or `countdownX` so they don't overlap.

When enabled, the script tries to read `MenuSection.SlideNumber` and `MenuSection.TotalSlides` (Storyline built-ins) first. If those aren't available via JavaScript, it falls back to user-created variables named `CurrentSlide` and `TotalSlides`. If neither source is available, the counter displays `Slide: --/--`.

## Disabling the Countdown

To use the script without the countdown (progress bar only):

- Set `showCountdown = false` near the top of the script.

The countdown element is then hidden permanently and the script behaves like the pre-2.0.0 versions.

## WARNING — Storyline Internal Dependency (countdown only)

The countdown reads the current slide via undocumented Storyline runtime paths:

- `DS.windowManager.getCurrentWindow().getCurrentSlide().attributes.currentTimeline.attributes.duration` (milliseconds)
- `slide.absoluteId` (for slide-change detection across ticks)
- `document.getElementById("next").classList.contains("cs-disabled")` (Next button state)

None of these are public Storyline API. If a Storyline update changes these paths, the countdown silently hides (fail-safe) — the progress bar and slide counter are unaffected. Re-verify after every Storyline update. Confirmed working on v3.116.36838.0 and v3.118.37003.0.

## Changelog

| Version | Date | Changes |
|---|---|---|
| 1.0.0 | — | Initial release with progress bar and slide counter (as `js-trigger-progress-bar-slide-count`) |
| 1.0.1 | 2026-05-14 | Slide counter hidden (`display:none`). All code retained for easy re-enabling. |
| 2.0.1 | 2026-05-29 | Revisit fix. Reordered the countdown display logic to check the Next button state before the timer, so a revisit to an already-completed slide (Next enabled on arrival) immediately shows the ready message instead of restarting a countdown. Confirmed in BLU that the prior order showed a stale countdown while Next was already usable. |
| 2.0.0 | 2026-05-28 | **Renamed** from `js-trigger-progress-bar-slide-count` to `js-trigger-player-header` to reflect that the script now manages multiple player-header indicators, not just the progress bar. **Added** Next-Gate countdown indicator. Reads the current slide's timeline duration from the Storyline runtime, counts down on wall-clock time, displays only when timeline ≥ `minSecondsToShow` seconds and a Next button exists. Hides on knowledge-check / certificate slides and when time is done but Next is still disabled (interactions pending). Switches to a ready message when Next becomes enabled. `waitTime` variable supported as a fallback and as an optional per-slide override. Confirmed working on Storyline v3.118.37003.0. New config: `showCountdown`, `waitTimeVar`, `minSecondsToShow`, `labelPrefix`, `readyMessage`, `countdownX`, `countdownTextWidth`, `waitTimeOverrides`. |
