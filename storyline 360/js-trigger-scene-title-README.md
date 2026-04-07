# JavaScript Trigger Scene Title in Storyline

**Author:** Joseph Black
**Version:** 1.0.0
**Tested with:** Articulate Storyline 360 x64 v3.113.36519.0

## What It Does

Automatically detects which scene the learner is currently in and writes the scene name into a Storyline variable called `SceneTitle`. This lets you display the current scene name anywhere on your slides using a `%SceneTitle%` text reference — no need to hard-code scene labels on every slide or maintain them manually when you reorganize.

## How It Works

1. Reads the current slide's title from Storyline's `CurrentSlideTitle` variable.
2. Searches the course menu DOM for the matching slide entry.
3. Walks backward through the menu until it finds a scene heading (marked with `data-is-scene="true"`).
4. Writes the scene name into the `SceneTitle` variable.

If the menu hasn't loaded yet when the script fires, it retries automatically (up to 20 attempts at 150 ms intervals).

## Setup

1. Open your Storyline project → **View → Slide Master** → select the **top-level master slide**.
2. Create two text variables in Storyline:
   - `CurrentSlideTitle` — set via a trigger to the built-in slide title, or leave it for the script to read.
   - `SceneTitle` — the script writes to this; reference it on-slide with `%SceneTitle%`.
3. Add a trigger: **Execute JavaScript** → paste the contents of `js-trigger-scene-title.js`.
4. The course menu must be **enabled** in the player for the script to find scene headings.

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
