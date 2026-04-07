# JavaScript Trigger Progress Bar Slide Count in Storyline

**Author:** Joseph Black
**Version:** 1.0.0
**Tested with:** Articulate Storyline 360 x64 v3.113.36519.0

## What It Does

Injects a dynamic progress bar with percentage text and a slide counter into the Storyline 360 course player's top bar. Displays three elements side by side:

- **"Course Progress: XX%"** — text label
- **Visual progress bar** — fills and changes color at 100%
- **"Slide: X/Y"** — current slide number out of total

This eliminates the need for on-slide progress elements or a dedicated completion page, keeping all slide real estate available for content.

## How It Works

1. On each slide load, the script checks whether the progress bar DOM elements already exist in the player's `links-right` container.
2. If they don't exist (first slide), it creates the full widget: text label, background track, fill bar, and slide counter.
3. If they do exist (subsequent slides), it updates the values in place.
4. A `setInterval` runs every 500 ms to keep the display in sync if variables change mid-slide (e.g. from layer triggers).
5. Two short `setTimeout` calls (150 ms and 400 ms) catch cases where Storyline's own scripts update variables slightly after the timeline starts.

## Setup

1. Open your Storyline project → **View → Slide Master** → select the **top-level master slide** (the parent, not a child layout).
2. Create a variable named `Progress` (capital P, case-sensitive).
3. Add a trigger: **Adjust Variable** → set `Progress` equal to `Menu.Progress` or `Project.Progress`.
   - `Menu.Progress` only counts slides visible in the menu (good for courses with optional/hidden slides).
   - `Project.Progress` counts all slides in the project.
4. Add a second trigger: **Execute JavaScript** → paste the contents of `js-trigger-progress-bar-slide-count.js`.
5. If your player has no right-side buttons (Resources, Glossary, etc.), add a placeholder character (e.g. a period) to a player tab to keep the `links-right` container visible.

## Customization

All configurable values are at the top of the script:

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
| `slideTextX` | `440px` | Left offset of the slide counter |

## Slide Counter

The script tries to read `MenuSection.SlideNumber` and `MenuSection.TotalSlides` (Storyline built-ins) first. If those aren't available via JavaScript, it falls back to user-created variables named `CurrentSlide` and `TotalSlides`. If neither source is available, the counter displays `Slide: --/--`.
