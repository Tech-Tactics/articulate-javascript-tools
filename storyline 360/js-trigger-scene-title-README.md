# JavaScript Trigger Scene Title in Storyline

**Author:** Joseph Black
**Version:** 1.0.1
**Date:** 2026-04-08
**Tested with:** Articulate Storyline 360 x64 v3.114.36620.0

## What It Does

Automatically detects which scene the learner is currently in and writes the scene name into a Storyline variable called `SceneTitle`. This lets you display the current scene name anywhere on your slides using a `%SceneTitle%` text reference. Without this script, you would need to manually type the scene name on every slide and update each one whenever you reorganize your course. Storyline does not provide a built-in variable for the scene name, so this script fills that gap.

## How It Works

1. Reads the current slide's title from Storyline's `CurrentSlideTitle` variable.
2. Searches the course menu DOM for the matching slide entry.
3. Walks backward through the menu until it finds a scene heading (marked with `data-is-scene="true"`).
4. Strips any menu numbering prefix from the scene name (e.g. "2.  Module 1 Foundations" becomes "Module 1 Foundations").
5. Writes the clean scene name into the `SceneTitle` variable.

If the menu hasn't loaded yet when the script fires, it retries automatically (up to 20 attempts at 150 ms intervals).

## Setup

1. Open your Storyline project, go to **View > Slide Master**, and select the **parent Slide Master**.
2. Create a trigger: **Adjust Variable**. Create a new variable called `CurrentSlideTitle` and set it to variable `Menu.SlideTitle`. Set it to fire when the timeline starts on this slide.
3. Create a second variable called `SceneTitle`. The script writes to this; reference it on-slide with `%SceneTitle%`.
4. Add a trigger: **Execute JavaScript** and paste the contents of `js-trigger-scene-title.js`.
5. The course menu must be **enabled** in the player for the script to find scene headings.

## Menu Numbering

This script works whether the player menu numbering is turned on or off. No changes are needed when switching between settings.

**Slide matching** uses an `endsWith` comparison rather than strict equality. When numbering is on, the menu entry "8.17.  Decision 3" ends with the slide title "Decision 3" and the match succeeds. When numbering is off, "Decision 3" ends with "Decision 3" and the match also succeeds.

**Scene name stripping** uses a regex that removes a leading number-period-spaces pattern only if one is present. When numbering is on, "2.  Module 1 Foundations" becomes "Module 1 Foundations". When numbering is off, "Module 1 Foundations" passes through unchanged.

## Browser Compatibility

Tested in Google Chrome and Microsoft Edge. The DOM behaved the same in both because they are both Chromium-based browsers. Other Chromium-based browsers should also work, though they have not been tested.

## Troubleshooting

The script writes diagnostic messages into `SceneTitle` when something goes wrong:

| Value | Meaning |
|---|---|
| `ERR reading CurrentSlideTitle` | The `CurrentSlideTitle` variable threw an error when read. |
| `NO CurrentSlideTitle` | The variable exists but is empty. |
| `NO menu rows` | The menu DOM couldn't be found after all retry attempts. |
| `NO slide match: [title]` | No menu entry matched the current slide title. |
| `NO row index` | The matched row wasn't found in the full row list (unexpected). |
| `BLANK scene row` | A scene heading was found but had no text. |
| `NO parent scene` | The slide appears before any scene heading in the menu. |

Display `%SceneTitle%` on a test slide during development to see these messages.

## Changelog

### 1.0.1 (2026-04-08)
- **Fixed:** Slide matching now uses `endsWith` instead of strict equality. This resolves a bug where slides would fail to match their menu entries when player menu numbering was turned on, because the menu prepends a number prefix (e.g. "8.17.") that the `CurrentSlideTitle` variable does not include.
- **Fixed:** Scene names are now stripped of their menu numbering prefix before being written to `SceneTitle`, so the variable contains a clean name like "Module 1 Foundations" instead of "2.  Module 1 Foundations".
- **Result:** The script now works correctly whether menu numbering is on or off without any configuration changes.

### 1.0.0 (2026-04-06)
- Initial release.
