# JavaScript Trigger Scene Title in Storyline

**Author:** Joseph Black
**Version:** 2.0.0
**Date:** 2026-04-08
**Tested with:** Articulate Storyline 360 x64 v3.114.36620.0

## What It Does

Automatically detects which scene the learner is currently in and writes the scene name into a Storyline variable called `SceneTitle`. This lets you display the current scene name anywhere on your slides using a `%SceneTitle%` text reference. Without this script, you would need to manually type the scene name on every slide and update each one whenever you reorganize your course. Storyline does not provide a built-in variable for the scene name, so this script fills that gap.

**This script works whether the player menu is enabled or not.**

## How It Works

The script uses two detection methods and tries them in order:

### Method 1 (Primary) - Internal Data Store

Reads `DS.slideNumberManager.links`, an internal Storyline data structure that contains the full course outline with scenes and their child slides. The script matches the current slide's title against the child slides in each scene. When it finds a match, it writes the parent scene's name to `SceneTitle`.

**This method works whether the player menu is enabled or not.** The data store exists in all published Storyline output regardless of menu settings.

### Method 2 (Fallback) - Menu DOM

If the data store is unavailable (for example, if a future Storyline update changes the internal structure), the script falls back to searching the player menu DOM for scene headings. This method requires the course menu to be enabled in the player.

If the menu hasn't loaded yet when the fallback runs, it retries automatically (up to 20 attempts at 150 ms intervals).

## Setup

1. Open your Storyline project, go to **View > Slide Master**, and select the **parent Slide Master**.
2. Create a trigger: **Adjust Variable**. Create a new variable called `CurrentSlideTitle` and set it to variable `Menu.SlideTitle`. Set it to fire when the timeline starts on this slide.
3. On the same parent Slide Master, add a second trigger: **Execute JavaScript** and paste the contents of `js-trigger-scene-title.js`. This script creates and writes to a variable called `SceneTitle`.
4. On any slide where you want the scene name to appear, insert a text reference using `%SceneTitle%`.

## Menu Numbering

This script works whether the player menu numbering is turned on or off. No changes are needed when switching between settings.

**Slide matching** uses an `endsWith` comparison rather than strict equality. When numbering is on, the entry "8.17.  Decision 3" ends with the slide title "Decision 3" and the match succeeds. When numbering is off, "Decision 3" ends with "Decision 3" and the match also succeeds.

**Scene name stripping** removes a leading number-period-spaces pattern only if one is present. When numbering is on, "2.  Module 1 Foundations" becomes "Module 1 Foundations". When numbering is off, "Module 1 Foundations" passes through unchanged.

## HTML Entity Decoding

Scene names from the internal data store may contain HTML entities (e.g. `&amp;` instead of `&`). The script automatically decodes these so `SceneTitle` displays clean text like "Curriculum & Lesson Plan Design" instead of "Curriculum &amp; Lesson Plan Design".

## Browser Compatibility

Tested in Google Chrome and Microsoft Edge. The DOM behaved the same in both because they are both Chromium-based browsers. Other Chromium-based browsers should also work, though they have not been tested.

## Troubleshooting

The script writes diagnostic messages into `SceneTitle` when something goes wrong:

| Value | Meaning |
|---|---|
| `ERR reading CurrentSlideTitle` | The `CurrentSlideTitle` variable threw an error when read. |
| `NO CurrentSlideTitle` | The variable exists but is empty. |
| `NO menu rows` | The data store method did not find a match and the menu DOM is not available. If you are not using the player menu, check that `CurrentSlideTitle` matches a slide name in the course. |
| `NO slide match: [title]` | No menu entry matched the current slide title (fallback method only). |
| `NO row index` | The matched row wasn't found in the full row list (unexpected). |
| `BLANK scene row` | A scene heading was found but had no text. |
| `NO parent scene` | The slide appears before any scene heading in the menu (fallback method only). |

Display `%SceneTitle%` on a test slide during development to see these messages.

## Changelog

### 2.0.0 (2026-04-08)
- **New:** Added primary detection method using `DS.slideNumberManager.links`, an internal Storyline data structure. This allows the script to determine the scene name without the player menu being enabled.
- **New:** The menu DOM lookup from v1.x is now a fallback method, used only if the data store is unavailable.
- **New:** HTML entities in scene names (e.g. `&amp;`) are automatically decoded.
- **Result:** The script now works whether the player menu is enabled or not.

### 1.0.1 (2026-04-08)
- **Fixed:** Slide matching now uses `endsWith` instead of strict equality. This resolves a bug where slides would fail to match their menu entries when player menu numbering was turned on, because the menu prepends a number prefix (e.g. "8.17.") that the `CurrentSlideTitle` variable does not include.
- **Fixed:** Scene names are now stripped of their menu numbering prefix before being written to `SceneTitle`, so the variable contains a clean name like "Module 1 Foundations" instead of "2.  Module 1 Foundations".
- **Result:** The script now works correctly whether menu numbering is on or off without any configuration changes.

### 1.0.0 (2026-04-06)
- Initial release.
