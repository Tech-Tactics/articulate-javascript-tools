# Articulate JavaScript Tools

A collection of JavaScript scripts for extending Articulate Storyline 360 and Articulate Rise 360 courses beyond their out-of-the-box capabilities.

## Author

**Joseph Black**

## Repository Structure

```
articulate-javascript-tools/
├── storyline 360/
│   ├── js-trigger-certificate-variables.js
│   ├── js-trigger-certificate-variables-README.md
│   ├── js-trigger-layer-audio-seekbar-unlock.js
│   ├── js-trigger-layer-audio-seekbar-unlock-README.md
│   ├── js-trigger-player-header.js
│   ├── js-trigger-player-header-README.md
│   ├── js-trigger-scene-title.js
│   ├── js-trigger-scene-title-README.md
│   └── storyline360-gate-next-button.md
├── rise 360/
├── LICENSE
└── README.md
```

## Storyline 360 Scripts

### JavaScript Trigger Player Header

**File:** `storyline 360/js-trigger-player-header.js`
**Version:** 2.0.1
**Tested with:** Articulate Storyline 360 x64 v3.118.37003.0

Injects course-level indicators into the Storyline player's top bar: a percentage progress bar ("Course Progress: XX%") with a visual fill, an optional slide counter ("Slide: X/Y"), and an optional "Next enables in: M:SS" countdown for time-gated slides. The countdown reads each slide's timeline duration automatically, hides itself on slides that don't need it (knowledge checks, short slides), and switches to "You may now continue." when the Next button becomes enabled. All three render in the player chrome, freeing up slide real estate.

**Setup:**
1. Open your Storyline project and go to **View → Slide Master**.
2. Select the **top-level master slide** (the parent, not a child layout).
3. Add a trigger: **Adjust Variable** → create a variable named `Progress` (capital P) → set it equal to `Menu.Progress` or `Project.Progress`.
4. Add a second trigger: **Execute JavaScript** → paste the contents of the script.
5. If your player has no right-side buttons (Resources, Glossary, etc.), add a placeholder character (e.g. a period) to a player tab to keep the container visible.

**Customization:**
The top of the script contains clearly labeled variables for colors, sizing, positioning, and countdown behavior (including a `showCountdown` on/off flag). Adjust these to match your course's branding and needs.

> **Note:** The countdown reads undocumented Storyline runtime internals and the Next button's DOM state. It fails safe (hides) if a Storyline update changes those internals, leaving the progress bar unaffected. Re-verify after every Storyline update.

See [js-trigger-player-header-README.md](storyline%20360/js-trigger-player-header-README.md) for full setup, customization, countdown behavior, and the slide counter details.

### JavaScript Trigger Scene Title

**File:** `storyline 360/js-trigger-scene-title.js`
**Version:** 3.0.0
**Tested with:** Articulate Storyline 360 x64 v3.114.36620.0

Automatically detects which scene the learner is currently in and writes the scene name into a `SceneTitle` variable. Display it on any slide using `%SceneTitle%`. No hard-coding needed. As of v3.0.0, it reads the scene directly from Storyline's internal data store, so it works whether the player menu is enabled or disabled and even on slides hidden from the menu, with a menu-DOM method as a last-resort fallback.

> **Note:** Reads undocumented Storyline internals (the `DS` global). Retest after every Storyline update.

See [js-trigger-scene-title-README.md](storyline%20360/js-trigger-scene-title-README.md) for full setup, detection methods, limitations, and troubleshooting details.

### JavaScript Trigger Certificate Variables

**File:** `storyline 360/js-trigger-certificate-variables.js`
**Version:** 1.1.0
**Tested with:** Articulate Storyline 360 x64 v3.115.36688.0

Populates two variables for use on a completion certificate. `lmsName` pulls the learner's name from the LMS via the SCORM API and reformats it from "Last, First" to "First Last". `completionDate` builds the current date in "Month D, YYYY" format from the learner's local system clock. Reference them on-slide with `%lmsName%` and `%completionDate%`.

> **Note:** The name portion requires the course to run inside a SCORM-compliant LMS; `lmsAPI` is not available in Preview or standalone output. The date portion works anywhere.

See [js-trigger-certificate-variables-README.md](storyline%20360/js-trigger-certificate-variables-README.md) for full setup, requirements, date-format customization, and troubleshooting.

## Storyline 360 Guides

### Gate the Next Button on Time + Interactions

**File:** `storyline 360/storyline360-gate-next-button.md`

A reusable trigger-only pattern for slides that should not allow learners to advance until they have both spent a minimum time on the slide and interacted with all required objects. Documents the variable and trigger architecture (Patterns A and B), common pitfalls, a testing checklist, and a section on hardening the time gate against seekbar scrubbing in LMS players. Pairs with the Player Header countdown above.

See [storyline360-gate-next-button.md](storyline%20360/storyline360-gate-next-button.md).

## Rise 360 Scripts

*Coming soon.*

## A Note on Undocumented Internals

Several of these tools read parts of Storyline's published output that Articulate does not officially document or support (the `DS` runtime global, internal player DOM classes). They are written to fail safe where possible and carry warnings in their individual READMEs. Because these internals can change between Storyline versions without notice, **retest any script that depends on them after every Storyline update before shipping a course.**

## License

This project is licensed under the [MIT License](LICENSE).
