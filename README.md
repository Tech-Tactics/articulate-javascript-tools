# Articulate JavaScript Tools

A collection of JavaScript scripts for extending Articulate Storyline 360 and Articulate Rise 360 courses beyond their out-of-the-box capabilities.

## Author

**Joseph Black**

## Repository Structure

```
articulate-javascript-tools/
├── storyline 360/
│   ├── js-trigger-progress-bar-slide-count.js
│   ├── js-trigger-progress-bar-slide-count-README.md
│   ├── js-trigger-scene-title.js
│   ├── js-trigger-scene-title-README.md
│   ├── js-trigger-retrieve-lms-name.js
│   └── js-trigger-retrieve-lms-name-README.md
├── rise 360/
├── LICENSE
└── README.md
```

## Storyline 360 Scripts

### JavaScript Trigger Progress Bar Slide Count

**File:** `storyline 360/js-trigger-progress-bar-slide-count.js`
**Version:** 1.0.0
**Tested with:** Articulate Storyline 360 x64 v3.113.36519.0

Injects a dynamic progress bar with percentage text and a slide counter into the Storyline course player chrome. Displays "Course Progress: XX%" alongside a visual bar and "Slide: X/Y" — all in the player's top bar, freeing up slide real estate.

**Setup:**

1. Open your Storyline project and go to **View → Slide Master**.
2. Select the **top-level master slide** (the parent, not a child layout).
3. Add a trigger: **Adjust Variable** → create a variable named `Progress` (capital P) → set it equal to `Menu.Progress` or `Project.Progress`.
4. Add a second trigger: **Execute JavaScript** → paste the contents of the script.
5. If your player has no right-side buttons (Resources, Glossary, etc.), add a placeholder character (e.g. a period) to a player tab to keep the container visible.

**Customization:**

The top of the script contains clearly labeled variables for colors, sizing, and positioning. Adjust these to match your course's branding.

See [js-trigger-progress-bar-slide-count-README.md](storyline%20360/js-trigger-progress-bar-slide-count-README.md) for full setup, customization, and slide counter details.

### JavaScript Trigger Scene Title

**File:** `storyline 360/js-trigger-scene-title.js`
**Version:** 1.0.0
**Tested with:** Articulate Storyline 360 x64 v3.113.36519.0

Automatically detects which scene the learner is currently in and writes the scene name into a `SceneTitle` variable. Display it on any slide using `%SceneTitle%` — no hard-coding needed.

See [js-trigger-scene-title-README.md](storyline%20360/js-trigger-scene-title-README.md) for full setup, usage, and troubleshooting details.

### JavaScript Trigger Retrieve LMS Name

**File:** `storyline 360/js-trigger-retrieve-lms-name.js`
**Version:** 1.0.0
**Tested with:** Articulate Storyline 360 x64 v3.113.36519.0

Retrieves the learner's name from the LMS via the SCORM API, reformats it from "Last, First" to "First Last", and stores it in an `lmsName` variable. Useful for personalized completion certificates or greeting messages — reference it on-slide with `%lmsName%`.

See [js-trigger-retrieve-lms-name-README.md](storyline%20360/js-trigger-retrieve-lms-name-README.md) for full setup, requirements, and considerations.

## Rise 360 Scripts

*Coming soon.*

## License

This project is licensed under the [MIT License](LICENSE).
