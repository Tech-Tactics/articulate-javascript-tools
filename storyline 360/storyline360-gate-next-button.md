# Storyline 360: Gate the Next Button on Time + Interactions

A reusable pattern for slides that should not allow learners to advance until they have **(a)** interacted with all required objects on the slide *and* **(b)** spent a minimum amount of time on the slide.

This document covers the trigger-only architecture, the variables involved, and the rationale. It assumes peer-level familiarity with Storyline 360 (variables, triggers, layers, states).

> **Note on the time gate:** The trigger-only patterns below satisfy the time requirement when the slide timeline ends. In some LMS players the published seekbar is draggable even when it is not draggable in Storyline's desktop preview, which lets a learner scrub to the end of the timeline and satisfy the time gate early. If your delivery environment allows seekbar scrubbing, see **Hardening the time gate against seekbar scrubbing** near the end of this document. The companion script `js-trigger-player-header.js` provides a wall-clock countdown indicator that visually reassures learners while the gate is timing, and pairs with seekbar removal to close the exploit.

---

## Why this exists

This pattern solves a common situation in self-paced compliance and training courses: ensuring learners actually engage with slide content rather than clicking through to the end as fast as possible.

A typical scenario looks like this: a course is built without narration (perhaps to control production cost, simplify maintenance, or accommodate a learner population that doesn't benefit from audio). Without narration timing as a natural pace control, designers often need to enforce some other floor on time-per-slide. A simple time delay alone is brittle — learners can switch tabs and wait it out without engaging. Requiring all interactive objects to be clicked is better, but a learner can still race through a slide in seconds without absorbing anything.

Combining both gates — a minimum time floor *and* required interaction with every visible flip card, button, or layer — addresses both failure modes. The cost is that Storyline's event-based trigger model doesn't natively express compound conditions over time, which is why the pattern below uses several triggers per slide instead of one or two.

---

## Pattern A — Two-card slide (worked example)

Use this when a slide has **2 flip cards / interactive objects**. For 3+ objects, see Pattern B.

### Variables (project-level)

| Name | Type | Default | Purpose |
|---|---|---|---|
| `time_met` | True/False | False | Flips True at the time threshold |
| `layer1_viewed` | True/False | False | Marks first interactive object as viewed |
| `layer2_viewed` | True/False | False | Marks second interactive object as viewed |

These variables are **global** in Storyline. The reset triggers below force them back to False on slide entry so they're safe to reuse across slides.

### Layer triggers (per flip-card layer)

On each card's "back side" layer, keep only:

- *Pause timeline on this layer when the timeline reaches 0.3s* — drives the swivel animation pause
- *Set `layerN_viewed` to True when the timeline reaches 0.2s* — marks the card as viewed

**No Next-button triggers belong on these layers.** The Next button is controlled entirely by base-layer triggers.

### Base-layer triggers (in this order)

| # | Action | When | Conditions |
|---|---|---|---|
| 1 | Change state of Next Button to **Disabled** | Timeline starts on this slide | (none) |
| 2 | Set `time_met` to False | Timeline starts on this slide | (none) |
| 3 | Set `layer1_viewed` to False | Timeline starts on this slide | (none) |
| 4 | Set `layer2_viewed` to False | Timeline starts on this slide | (none) |
| 5 | Set `time_met` to True | Timeline ends on this slide *(or "reaches 30s")* — see seekbar note below | (none) |
| 6 | Change state of Next Button to **Normal** | Timeline ends on this slide | If `layer1_viewed` = True **AND** `layer2_viewed` = True |
| 7 | Change state of Next Button to **Normal** | Variable `layer1_viewed` changes | If `layer1_viewed` = True **AND** `layer2_viewed` = True **AND** `time_met` = True |
| 8 | Change state of Next Button to **Normal** | Variable `layer2_viewed` changes | If `layer1_viewed` = True **AND** `layer2_viewed` = True **AND** `time_met` = True |

> Trigger 5 is the time gate. It is the trigger vulnerable to seekbar scrubbing. If your LMS allows scrubbing, replace Trigger 5 with the wall-clock countdown script (see the hardening section near the end). Triggers 1–4 and 6–8 stay the same; only the source of `time_met` changes.

### Why three enable triggers (6, 7, 8)?

Storyline triggers fire on events, not on continuous condition monitoring. The three gates can be satisfied in three different orders:

- **Time finishes last** → Trigger 6 fires when timeline ends, sees both cards viewed, enables Next.
- **Card 1 finishes last** → Trigger 7 fires when `layer1_viewed` changes, sees other gates met, enables Next.
- **Card 2 finishes last** → Trigger 8 fires when `layer2_viewed` changes, sees other gates met, enables Next.

Without all three, the slide breaks for any completion order whose final event isn't being watched.

### Slide properties

Set **When revisiting → Reset to initial state**. This pairs with the variable resets (Triggers 2-4) to ensure clean revisit behavior.

---

## Pattern B — Scaling to N interactive objects

The two-card pattern scales linearly: 8 cards would mean 8 enable triggers, each with 9-condition IF clauses. That's a maintenance disaster — one missed AND, one mistyped variable name, and the gate silently breaks.

For slides with **3 or more interactive objects**, switch to the counter-variable pattern.

### Variables (project-level)

| Name | Type | Default | Purpose |
|---|---|---|---|
| `time_met` | True/False | False | Same as Pattern A |
| `cards_viewed` | Number | 0 | Increments by 1 each time a unique card is viewed |
| `layer1_viewed` ... `layerN_viewed` | True/False | False | Per-card flags to prevent double-counting |

The per-card `layerN_viewed` flags are still useful here — they guard against learners re-clicking the same card and incrementing the counter twice. If you don't care about double-counting, you can skip them and use `cards_viewed >= N` (instead of `=`) in the gate condition.

### Layer triggers (per card layer)

On each card's "back side" layer:

- *Pause timeline on this layer when the timeline reaches 0.3s*
- *Add 1 to `cards_viewed` when the timeline reaches 0.2s, if `layerN_viewed` = False*
- *Set `layerN_viewed` to True when the timeline reaches 0.2s*

The conditional add-1 prevents double-counting on revisits to the layer.

### Base-layer triggers

| # | Action | When | Conditions |
|---|---|---|---|
| 1 | Change state of Next Button to **Disabled** | Timeline starts | (none) |
| 2 | Set `time_met` to False | Timeline starts | (none) |
| 3 | Set `cards_viewed` to 0 | Timeline starts | (none) |
| 4 | Set `layer1_viewed` to False (repeat for each `layerN_viewed`) | Timeline starts | (none) |
| 5 | Set `time_met` to True | Timeline ends — see seekbar note below | (none) |
| 6 | Change state of Next Button to **Normal** | Timeline ends | If `cards_viewed` >= **N** |
| 7 | Change state of Next Button to **Normal** | Variable `cards_viewed` changes | If `cards_viewed` >= **N** **AND** `time_met` = True |

**Replace N with the actual card count for the slide.** This is the only number that changes per slide.

> As in Pattern A, Trigger 5 is the seekbar-vulnerable time gate. Swap it for the countdown script if scrubbing is possible in your LMS.

### Per-slide changes when replicating Pattern B

When duplicating this pattern to a new slide:

1. Update the comparison number `>= N` in Triggers 6 and 7 to match the slide's card count.
2. Add/remove `layerN_viewed` reset triggers to match the slide's card count.
3. Layer triggers per card stay the same shape — just point each one at its own `layerN_viewed` flag.

The base-layer trigger count stays at **7 regardless of how many cards** are on the slide. This is the main reason to prefer Pattern B at scale.

---

## Common pitfalls

These are the things that broke during initial development. Watch for them when building or reviewing.

### AND vs OR in IF conditions

Storyline's condition editor lets you join multiple conditions with **AND** or **OR**. The default is "and," but it can default to "or" if your previous trigger used OR. **A single mismatched OR breaks the gate completely** because any one True condition will pass the IF check.

When in doubt, click each connector word between conditions and verify it reads "and."

### The player's built-in Next button has no Initial State property

For slide objects (custom buttons, shapes), you can set Initial State via the dropdown at the top of the Triggers panel. The player's Next button doesn't expose this — the only way to set its starting state is a trigger that fires on timeline start. This is why Pattern A starts with "Disable Next when timeline starts."

### Disabled buttons swallow click events

The player's Next button in the **Disabled** state does not fire click triggers. This means you cannot show an error layer when a learner clicks a disabled Next button — the click is simply ignored. The available states for the player's Next button are **Normal**, **Hidden**, and **Disabled**; custom states are not supported on this control.

If error feedback on premature Next clicks is required, the only clean solution is to **hide the player's built-in Next button** and replace it with a custom button on the slide master that has its own click triggers. This is a one-time refactor that benefits the whole project.

### The timeline-based time gate can be scrubbed in some LMS players

This is the most important pitfall to know about, and it is not visible in Storyline's desktop preview. The time gate (Trigger 5 in both patterns) sets `time_met` to True when the slide timeline ends. In some LMS players — confirmed in at least one production environment — the published seekbar is draggable even though it is locked in Storyline's preview. A learner can grab the seekbar and drag the playhead to the end of the timeline, which fires the timeline-end event and satisfies the time gate in about one second.

The interaction gate (clicking all cards) still holds, but the time floor is defeated. If your delivery environment allows seekbar scrubbing, do not rely on the timeline-ends time gate. See the hardening section below.

### Variables are global and persist across slides

Variables retain their value across slides until something explicitly changes them. Default values only apply at course launch. **Without the slide-entry resets (Triggers 2-4 in Pattern A, 2-4 in Pattern B), a slide will inherit the previous slide's variable values** — and the gate will appear to skip on every slide after the first.

The reset triggers are non-negotiable. Add them first; verify they fire before anything else.

### Layer timelines are not slide timelines

Triggers placed on a layer reference *that layer's* timeline, not the slide's main timeline. A flip-card layer with a 0.3-second timeline cannot drive a 30-second time gate. The time-gate trigger must live on the **base layer** where the slide's main timeline runs.

### "Timeline reaches X seconds" inside an IF clause is unreliable

Storyline does not provide a stable way to check the current timeline position inside an IF clause. Use a True/False variable (`time_met`) that flips at the time threshold, and check the variable in IF clauses. Do not try to compare timeline position directly inside an IF.

### Trigger order matters within the same event

Multiple triggers firing on the same event (e.g., "timeline starts") fire in **top-down order** as listed in the Triggers panel. Ensure variable resets appear above any triggers that depend on those resets having run. Use the up-arrow in the Triggers panel toolbar to reorder.

---

## Hardening the time gate against seekbar scrubbing

If your LMS allows seekbar scrubbing (test this in the actual published environment, not just Storyline preview), the timeline-ends time gate is bypassable. There are two clean fixes.

### Option 1 — Remove the seekbar on gated slides

If there is no seekbar, there is nothing to drag. With the seekbar removed, the timeline plays at normal speed, the timeline-end event fires only when the timeline actually ends, and the trigger-only patterns above work exactly as designed — no script needed. This is the simplest fix.

Trade-off: the seekbar is also a per-slide progress indicator. Removing it means learners lose that visual cue for why Next is disabled. Pair removal with a visible "Next enables in: M:SS" indicator (see Option 2's script, which can run in display-only mode) or with on-slide text explaining the wait. Keep playback controls on any slide with narration, audio, or video that the learner legitimately needs to control.

### Option 2 — Wall-clock countdown indicator

The companion script `js-trigger-player-header.js` renders a "Next enables in: M:SS" countdown in the player's top bar, measured on the browser's real clock. The countdown reads the current slide's timeline duration automatically (no per-slide variable required), counts down independently of the timeline, and switches to "You may now continue." when the Next button becomes enabled.

This option pairs with **Option 1**: it provides the visible reassurance that the gate is timing, while seekbar removal handles closing the exploit. The countdown is display-only — it does not drive `time_met` or any gate variable, so all existing triggers stay exactly as they are.

To integrate it:

1. Open your Storyline project → **View → Slide Master** → select the top-level master slide.
2. Add an **Execute JavaScript** trigger that runs once (e.g., when the timeline starts on the master) and paste the contents of `js-trigger-player-header.js`. If you already use this script for the progress bar, no additional trigger is needed — the countdown is included in v2.0.0+.
3. Set each gated slide's timeline length to its intended gate duration. The countdown reads this automatically.
4. **Keep Trigger 5** (Set `time_met` to True when timeline ends) on each gated slide. The countdown does not replace the trigger-based gate; it only displays alongside it.
5. No per-slide variables required. Optional: create a `waitTime` Number variable if you want a manual override on specific slides (set `waitTimeOverrides = true` in the script's config block to give `waitTime` precedence over the timeline duration).

The countdown hides automatically on slides where it shouldn't apply: knowledge checks (no Next button), short slides (under `minSecondsToShow` seconds, default 10), and the moment after time elapses but Next is still disabled by pending interactions (the slide's own visuals communicate what's left to do).

See `js-trigger-player-header-README.md` for full configuration, including the `showCountdown` master on/off flag and positioning controls.

---

## Testing checklist

For each gated slide, verify all three completion orderings:

**Test 1 — Interactions before timer:**
1. Preview slide. Next is disabled.
2. Click all interactive objects within ~5 seconds.
3. Wait. Next should remain disabled until the time threshold.
4. At the time threshold, Next becomes enabled.

**Test 2 — Timer before interactions:**
1. Preview slide. Wait through the time threshold without interacting.
2. Next remains disabled.
3. Click interactive objects one by one.
4. Next becomes enabled when the last object is viewed.

**Test 3 — Partial interaction:**
1. Preview slide. Click only some objects.
2. Wait through the time threshold.
3. Next remains disabled until all objects are viewed.

**Test 4 — Revisit:**
1. Complete the slide and advance to the next slide.
2. Navigate back to the gated slide via Previous or menu.
3. Next is disabled again. Variables are reset. Cards visually appear unvisited (if "Reset to initial state" is set).

**Test 5 — Seekbar scrub (run in the published LMS, not preview):**
1. On a gated slide, before the time threshold, grab the seekbar and drag the playhead to the end.
2. Next should remain disabled until the real time threshold has elapsed.
3. If Next enables early, the timeline-ends time gate is being bypassed — apply one of the hardening options above. This test only matters in the actual LMS, because the desktop preview locks the seekbar.

### Diagnostic technique

If a test fails, place a temporary text box on the slide showing live variable values:

```
L1: %layer1_viewed%   L2: %layer2_viewed%   T: %time_met%
```

Or for Pattern B:

```
Cards: %cards_viewed%   T: %time_met%
```

Storyline replaces `%variable%` with the current value during preview. This makes it immediately obvious whether triggers are firing as expected. Delete the diagnostic text box once the slide is verified.

---

## Estimated impact on course duration

Each gated slide imposes a minimum time floor on completion. To estimate course minimums:

- **Floor per slide** = time threshold (e.g., 30 seconds)
- **Realistic per slide** = floor + ~5–10 seconds for the learner to react when Next enables
- **Course floor** = (gated slide count × time threshold) + (non-gated slide count × ~10 seconds)

For 65 gated slides at 30s + 16 non-gated at 10s, the course floor is approximately **35 minutes**. Realistic completion is typically 1.3–1.5× the floor.

Consider varying the time threshold per slide based on content density — dense slides may warrant 45–60 seconds, lighter slides 15–20 — rather than applying a uniform threshold across the whole course. A uniform threshold feels arbitrary on slides where it's clearly too long or too short for the actual content. Stopwatch-testing a representative sample of slides (one short, one typical, one dense, one interaction-heavy) is a quick way to calibrate the thresholds against real reading time rather than guessing.

---

## Related patterns and companions

- **`js-trigger-player-header.js`** — renders a "Next enables in: M:SS" countdown in the player chrome that pairs with seekbar removal to give learners visible reassurance the gate is timing. Display-only: does not modify any gate triggers. The recommended companion to this pattern when the delivery LMS allows seekbar scrubbing.
- **Custom Next button on slide master** — required if error-layer feedback on premature clicks is needed. One-time refactor, benefits the whole project.
- **Per-slide completion flags** — allows skipping the gate on revisit if the learner has already completed a slide. Adds one boolean variable per gated slide but improves UX for review/navigation.

---

## Maintenance notes

- If narration is later added to a course using this pattern, the time gates can typically be removed and replaced with audio-completion triggers.
- The time threshold (e.g., 30 seconds) is a project-level decision. Adjust per slide as content density warrants — a uniform threshold often feels arbitrary on slides where it's clearly too long or too short for the content.
- All gated slides can share the same `time_met` variable; only the per-card flags or counter variable need to differ between slides.
- When adding new gated slides, copy an existing working slide rather than building from scratch — the trigger structure is mechanical and copy-tweak is faster than rebuilding.
- Always run Test 5 (seekbar scrub) in the actual published LMS before considering a gated course complete. The exploit is invisible in Storyline's desktop preview.

---

## Changelog

| Version | Date | Changes |
|---|---|---|
| 1.0.0 | — | Initial pattern: trigger-only time + interaction gate (Patterns A and B), pitfalls, testing checklist. |
| 1.1.0 | 2026-05-21 | Documented the seekbar-scrubbing exploit and added a hardening section with two fixes (remove seekbar; wall-clock countdown script). Added Test 5. Updated the "JavaScript gating not used" note, which is now superseded by the companion script. |
| 1.2.0 | 2026-05-28 | Reconciled with the renamed companion script `js-trigger-player-header.js` (v2.0.0). Rewrote Option 2 in the Hardening section to reflect the merged script's current behavior: chrome-rendered countdown, display-only (does not modify gate triggers), reads timeline duration automatically, paired with seekbar removal rather than replacing the trigger-based gate. |
