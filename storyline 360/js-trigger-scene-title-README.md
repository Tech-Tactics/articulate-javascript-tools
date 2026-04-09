# JavaScript Trigger Scene Title in Storyline

**Author:** Joseph Black
**Version:** 3.0.0
**Date:** 2026-04-09
**Tested with:** Articulate Storyline 360 x64 v3.114.36620.0

## What It Does

Automatically detects which scene the learner is currently in and writes the scene name into a Storyline variable called `SceneTitle`. This lets you display the current scene name anywhere on your slides using a `%SceneTitle%` text reference. Without this script, you would need to manually type the scene name on every slide and update each one whenever you reorganize your course. Storyline does not provide a built-in variable for the scene name, so this script fills that gap.

**This script works whether the player menu is enabled or not, and it works on slides that have been hidden from the menu.**

## How It Works

The script uses three detection methods and tries them in order:

### Method 1 (Primary) - Slide ID Lookup

Reads the current slide ID from Storyline's internal data store (`DS.presentation.attributes.slideMap.currentSlideId`). The ID contains the scene ID as its first component. The script matches the scene ID against `DS.slideNumberManager.links` to get the scene display name.

**This method works whether the player menu is enabled or not. It also works on slides that have been hidden from the menu.** The internal data store exists in all published Storyline output regardless of menu or slide visibility settings.

### Method 2 (Fallback) - Title Matching via Data Store

If the slide ID lookup fails, the script reads the current slide's title from the internal scene/slide model data and matches it against the child slide names in `DS.slideNumberManager.links` to find the parent scene.

### Method 3 (Last Resort) - Menu DOM

If both data store methods fail (for example, if a future Storyline update changes the internal structure), the script searches the player menu DOM for scene headings. **This method requires the course menu to be enabled in the player.** If the menu hasn't loaded yet, it retries automatically (up to 20 attempts at 150 ms intervals).

## Setup

1. Open your Storyline project, go to **View > Slide Master**, and select the **parent Slide Master**.
2. Add a trigger: **Execute JavaScript** and paste the contents of `js-trigger-scene-title.js`. Set it to fire when the timeline starts. Storyline requires you to select an object on the Slide Master for the trigger to reference. Choose a persistent object that will always be present, such as the background image.
3. On any slide where you want the scene name to appear, insert a text reference using `%SceneTitle%`.

That's it. No other triggers or variables are required. Previous versions needed a `CurrentSlideTitle` variable and a `Menu.SlideTitle` trigger. Version 3.0.0 reads everything it needs directly from the internal data store.

## Hidden Slides

This script works on slides that have been hidden from the player menu. This is a key improvement over previous versions and over using built-in Storyline variables.

For reference, the built-in variable `Menu.SlideTitle` returns blank on slides that have been hidden from the menu, even when the menu is enabled. The menu does not recognize hidden slides, so any approach that depends on `Menu.SlideTitle` will fail on them. Version 3.0.0 avoids this by reading the current slide ID directly from the internal data store, which tracks all slides regardless of menu visibility.

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
| `NO slide title available` | The script could not read a slide title from the data store or from a CurrentSlideTitle variable (Method 3 only). |
| `NO menu rows` | All three methods failed. The data store methods did not find a match and the menu DOM is not available. |
| `NO slide match: [title]` | No menu entry matched the current slide title (Method 3 only). |
| `NO row index` | The matched row wasn't found in the full row list (unexpected). |
| `BLANK scene row` | A scene heading was found but had no text. |
| `NO parent scene` | The slide appears before any scene heading in the menu (Method 3 only). |

Display `%SceneTitle%` on a test slide during development to see these messages.

## Changelog

### 3.0.0 (2026-04-09)
- **New:** Rewrote primary detection to use the current slide ID from Storyline's internal data store (`DS.presentation.attributes.slideMap.currentSlideId`). The scene ID is extracted from the slide ID and matched against `DS.slideNumberManager.links`.
- **New:** The script no longer requires a `CurrentSlideTitle` variable or a `Menu.SlideTitle` Adjust Variable trigger. Setup is now a single Execute JavaScript trigger.
- **New:** Works on slides that have been hidden from the player menu.
- **Changed:** Title matching via data store is now Method 2 (fallback).
- **Changed:** Menu DOM lookup is now Method 3 (last resort).
- **Result:** The script works in all configurations: menu on, menu off, slides hidden, numbering on, numbering off.

### 2.0.0 (2026-04-08)
- **New:** Added data store title matching so the script works without the player menu enabled.
- **New:** HTML entities in scene names (e.g. `&amp;`) are automatically decoded.

### 1.0.1 (2026-04-08)
- **Fixed:** Slide matching now uses `endsWith` instead of strict equality. This resolves a bug where slides would fail to match their menu entries when player menu numbering was turned on, because the menu prepends a number prefix (e.g. "8.17.") that the `CurrentSlideTitle` variable does not include.
- **Fixed:** Scene names are now stripped of their menu numbering prefix before being written to `SceneTitle`.

### 1.0.0 (2026-04-06)
- Initial release.
