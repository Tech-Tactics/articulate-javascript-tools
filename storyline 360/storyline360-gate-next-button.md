# Storyline 360: Gate the Next Button on Time + Interactions

A reusable pattern for slides that should not allow learners to advance until they have **(a)** interacted with all required objects on the slide *and* **(b)** spent a minimum amount of time on the slide.

This README documents the trigger architecture, the variables involved, and the rationale. It assumes peer-level familiarity with Storyline 360 (variables, triggers, layers, states).

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
| 5 | Set `time_met` to True | Timeline ends on this slide *(or "reaches 30s")* | (none) |
| 6 | Change state of Next Button to **Normal** | Timeline ends on this slide | If `layer1_viewed` = True **AND** `layer2_viewed` = True |
| 7 | Change state of Next Button to **Normal** | Variable `layer1_viewed` changes | If `layer1_viewed` = True **AND** `layer2_viewed` = True **AND** `time_met` = True |
| 8 | Change state of Next Button to **Normal** | Variable `layer2_viewed` changes | If `layer1_viewed` = True **AND** `layer2_viewed` = True **AND** `time_met` = True |

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
| 5 | Set `time_met` to True | Timeline ends | (none) |
| 6 | Change state of Next Button to **Normal** | Timeline ends | If `cards_viewed` >= **N** |
| 7 | Change state of Next Button to **Normal** | Variable `cards_viewed` changes | If `cards_viewed` >= **N** **AND** `time_met` = True |

**Replace N with the actual card count for the slide.** This is the only number that changes per slide.

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

Consider varying the time threshold per slide based on content density — dense slides may warrant 45–60 seconds, lighter slides 15–20 — rather than applying a uniform threshold across the whole course. A uniform threshold feels arbitrary on slides where it's clearly too long or too short for the actual content.

---

## Related patterns not covered here

- **Custom Next button on slide master** — required if error-layer feedback on premature clicks is needed. One-time refactor, benefits the whole project.
- **Per-slide completion flags** — allows skipping the gate on revisit if the learner has already completed a slide. Adds one boolean variable per gated slide but improves UX for review/navigation.
- **JavaScript-based gating** — possible but not used in this pattern. Sacrifices auditability through the trigger panel and creates handoff complexity for developers unfamiliar with the script.

---

## Maintenance notes

- If narration is later added to a course using this pattern, the time gates can typically be removed and replaced with audio-completion triggers.
- The time threshold (e.g., 30 seconds) is a project-level decision. Adjust per slide as content density warrants — a uniform threshold often feels arbitrary on slides where it's clearly too long or too short for the content.
- All gated slides can share the same `time_met` variable; only the per-card flags or counter variable need to differ between slides.
- When adding new gated slides, copy an existing working slide rather than building from scratch — the trigger structure is mechanical and copy-tweak is faster than rebuilding.
