# JavaScript Trigger Layer-Audio Seekbar Unlock in Storyline

**Author:** Joseph Black
**Version:** 1.0.0
**Date:** 2026-05-21
**Tested with:** Articulate Storyline 360 x64 v3.116.36838.0

## What It Does

Storyline locks the player seekbar into a read-only state while audio is playing on a slide **layer** (as opposed to the base layer). The seekbar moves to show progress but cannot be dragged to scrub. This script defeats that lock so a learner can click or drag the seekbar to scrub through layer audio.

It comes in two parts, each pasted into its own JavaScript trigger:

- **Part 1 — Audio Tracker.** A one-time setup that listens for any audio element starting to play and stores a reference to the most recent one in `window._bopLayerAudio`. This is how Part 2 knows which audio element to scrub.
- **Part 2 — Cleanup + Unlock.** Runs on slides whose layer audio should be scrubable. It removes any previously attached custom handlers, strips Storyline's lock classes and styles after a short delay, and wires up custom mouse, pointer, and touch handlers that translate a click or drag position on the seekbar into `audio.currentTime`.

## How It Works

1. **Part 1** installs a capture-phase `play` listener on `document`. Capture phase means it fires before any handlers on the audio element itself. It filters to `HTMLAudioElement` (audio only, not video) and stores the element in `window._bopLayerAudio`. A guard flag (`window._bopLayerAudioTrackerInstalled`) ensures it installs only once across the whole course.
2. **Part 2** first cleans up any custom handlers left on a prior seekbar reference. Then, after a 250 ms delay (to let Storyline finish rendering the locked seekbar), it:
   - Removes the `read-only` and `slide-lockable` classes and re-enables pointer events, so the seekbar looks and behaves draggable.
   - Defines a position-to-percentage helper and a percentage-to-`currentTime` helper.
   - Attaches `pointerdown` / `mousedown` / `mousemove` / `mouseup` / `touchend` handlers that scrub the tracked audio when the learner clicks or drags.
   - Stores the handler set on `seekbar._bopHandlers` so a later run can remove them cleanly.

## Setup

1. **Part 1 (Audio Tracker):** Add an **Execute JavaScript** trigger that runs once early in the course — for example on the navigation/how-to slide, or on the first slide's timeline start. Paste Part 1 of `js-trigger-layer-audio-seekbar-unlock.js`.
2. **Part 2 (Cleanup + Unlock):** On each slide whose layer audio should be scrubable, add an **Execute JavaScript** trigger when the timeline starts (or when the relevant layer shows). Paste Part 2.
3. Confirm the layer audio actually plays through an `HTMLAudioElement` (standard for Storyline audio). Video is intentionally excluded by the tracker's `instanceof HTMLAudioElement` filter.

## Storyline / Window Dependencies

| Name | Role |
|---|---|
| `window._bopLayerAudio` | Reference to the most recently started audio element. Set by Part 1, read by Part 2. |
| `window._bopLayerAudioTrackerInstalled` | One-time install guard for the tracker. |
| `seekbar._bopHandlers` | Stores the custom handler set on the seekbar element for clean removal on re-run. |

## WARNING — Storyline Internal Dependency

Part 2 depends on undocumented Storyline player CSS class names and DOM structure:

- `.controls__seekbar`
- `.progress-bar.cs-seekcontrol`
- `.cs-seekbar-inner`
- `.read-only`
- `.slide-lockable`

These are not part of any public API and may change between Storyline versions. If a Storyline update changes these classes, the unlock will **silently stop working** — the seekbar simply returns to its locked state with no error message. Re-verify this script after every Storyline update before relying on it in a published course.

## Notes

- **Audio only.** The tracker filters to `HTMLAudioElement`, so it ignores video. To also catch video, the filter would need to use `HTMLMediaElement` (the parent class). This is intentional in the current version.
- **Most-recent-audio model.** The tracker always points at whatever audio started most recently. On a slide with multiple audio clips, scrubbing affects the latest one to begin playing.
- **Opposite of a gated slide's needs.** This script intentionally *enables* seekbar scrubbing. On time-gated content slides, scrubbing is undesirable (it can bypass a timeline-based gate). Use this only on slides where scrubbing layer audio is a deliberate convenience, not on gated slides.

## Changelog

| Version | Date | Changes |
|---|---|---|
| 1.0.0 | 2026-05-21 | Initial packaging. Code preserved verbatim from working project; documentation header, part delimiters, and Storyline-internal dependency warning added. |
