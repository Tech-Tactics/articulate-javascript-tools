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

## Known Limitations and Risks

This script relies on parts of Storyline's published output that Articulate does not officially document or support. Before using it in production, understand the tradeoffs:

### Dependency on an undocumented internal API

Methods 1 and 2 read from a global `DS` object (`DS.presentation`, `DS.slideNumberManager`) that Storyline exposes in its published HTML5 output. **This is not a public API.** Articulate has not documented it, does not support it, and could rename, restructure, or remove it in any future update without notice. If that happens, Methods 1 and 2 will stop working and the script will fall back to Method 3 (menu DOM).

This is the same category of risk as the `lmsAPI` object used by many community scripts — widely relied on but technically unsupported. It has been stable across many Storyline versions, but there is no guarantee it will stay that way.

### Method 3 requires the menu to be enabled

If Articulate breaks the `DS` global and the course author has the player menu disabled, **all three methods fail** and `SceneTitle` will contain a diagnostic string like "NO menu rows". If you rely on this script for a course where the menu is disabled, test thoroughly after every Storyline update.

### Scene ID matching uses a substring comparison

In Method 1, scene IDs are matched with `indexOf() > -1` rather than strict equality. This was done because the link's `slideid` field is formatted as `_player.sceneId` or similar, and the exact format is not documented. If Storyline ever generates scene IDs where one is a substring of another (e.g., scene `6Jy7` existing alongside scene `6Jy77xK`), the script could match the wrong scene. This has not been observed in practice, but it is a theoretical weakness of the current implementation.

### Retry logic only applies to Method 3

If the `DS` data store is briefly unavailable at timeline start (rare but possible on the very first slide of a course), Methods 1 and 2 fire once and give up without retrying. The script falls straight through to Method 3 and the retry loop begins there. In practice this has not caused issues, but it means a transient data store hiccup will force a reliance on the menu DOM even when the menu-independent methods should have worked.

### Preview vs. published behavior

The script has been tested successfully in both Storyline Preview and published output. Behavior may differ slightly in an LMS environment due to LMS-specific wrappers, iframes, or security policies, so always verify the script works in your target LMS before shipping a course.

### Tested only in Chromium browsers

Tested in Google Chrome and Microsoft Edge. Other browsers (Firefox, Safari) have not been tested. The script uses standard DOM and JavaScript features that should work in any modern browser, but the `DS` global's behavior in non-Chromium browsers is unverified.

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

Tested in Google Chrome and Microsoft Edge. The DOM behaved the same in both because they are both Chromium-based browsers. Other Chromium-based browsers should also work, though they have not been tested. Firefox and Safari are untested.

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

If you see "NO menu rows" on a course where all three methods should work, the most likely causes are:
1. Articulate changed the internal `DS` structure in a Storyline update (affects Methods 1 and 2)
2. The menu is disabled in the player (affects Method 3)
3. An LMS wrapper is interfering with the published output

## Testing After Storyline Updates

Because this script relies on undocumented internals, **retest after every Storyline update before shipping courses**. A quick smoke test:

1. Open a course with the menu enabled. Confirm `%SceneTitle%` shows correctly on several slides across different scenes.
2. Disable the menu, republish, and confirm `%SceneTitle%` still shows correctly. If it shows "NO menu rows" or similar, Methods 1 and 2 have broken and you need to inspect the current `DS` object structure in the browser console.
3. On a slide hidden from the menu, confirm `%SceneTitle%` still resolves correctly.
4. Upload to your target LMS and verify the behavior there matches what you saw in Preview and local published output.

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
