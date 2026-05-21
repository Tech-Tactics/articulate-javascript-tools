/* ============================================================================
 * Next-Button Gate Countdown — "Next enables in: M:SS"
 * ============================================================================
 * Purpose:     Displays a live, second-by-second countdown showing how long
 *              until the Next button becomes available on a time-gated slide,
 *              AND drives the time portion of the gate itself. When the
 *              countdown reaches zero, the script sets the Storyline variable
 *              "time_met" to true, which the slide's existing enable triggers
 *              use (in combination with interaction-completion variables) to
 *              turn the Next button on.
 *
 *              The countdown runs on real wall-clock time (Date.now), not the
 *              slide timeline. This is deliberate: it makes the time gate
 *              immune to seekbar scrubbing. Dragging the seekbar to the end of
 *              the timeline no longer satisfies the gate, because the gate no
 *              longer depends on the "timeline ends" event.
 *
 * Author:      Joseph Black
 * Date:        2026-05-21
 * Version:     1.0.0
 * Software:    Articulate Storyline 360 (v3.115.36688.0), HTML5 output
 *
 * Usage:       STORYLINE VARIABLES (create these in Manage Variables):
 *                - gateSeconds    (Number, default 0)   INPUT: total gate
 *                                                        length in seconds for
 *                                                        the current slide.
 *                - countdownText  (Text, default "")    OUTPUT: the script
 *                                                        writes the display
 *                                                        string here.
 *                - time_met       (True/False, def False) OUTPUT: set to true
 *                                                        when the countdown
 *                                                        completes. This is the
 *                                                        same variable the
 *                                                        existing gate uses.
 *
 *              SLIDE SETUP (per gated slide):
 *                1. Add a trigger ABOVE the JavaScript trigger:
 *                     "Set gateSeconds to [this slide's gate length]
 *                      when the timeline starts on this slide."
 *                   Example: a 25-second gate -> Set gateSeconds to 25.
 *                2. Add a JavaScript trigger:
 *                     "Execute JavaScript when the timeline starts on this
 *                      slide" and paste this entire script.
 *                3. REMOVE the old trigger
 *                     "Set time_met to True when the timeline ends"
 *                   if present. The script now owns time_met. Leaving the old
 *                   trigger in place would re-open the seekbar exploit.
 *                4. Place a text box on the slide containing exactly:
 *                     Next enables in: %countdownText%
 *                   (Or just %countdownText% if you prefer the script to supply
 *                   the full label -- see CONFIG.includeLabel below.)
 *                5. Keep your existing enable triggers unchanged, e.g.:
 *                     "Change state of Next to Normal when time_met changes,
 *                      if [all interaction variables] = True"
 *                     ...and the mirror triggers that fire when the interaction
 *                     variables change, if time_met = True.
 *
 *              The reset triggers at slide start (Set time_met to False, etc.)
 *              should remain. This script reads gateSeconds and begins counting
 *              the moment the timeline starts.
 *
 * Notes:       - Wall-clock based: cannot be bypassed by scrubbing the seekbar.
 *                Because of this, the seekbar can be safely left visible OR
 *                removed; scrubbing no longer affects the gate either way.
 *              - Background tabs: most browsers throttle timers in background
 *                tabs, so the on-screen number may update less often when the
 *                learner switches away. Because the script reads true elapsed
 *                time (Date.now) on each tick, the value stays ACCURATE even
 *                if updates are infrequent -- it may visibly "jump" to the
 *                correct remaining time when the tab regains focus rather than
 *                ticking smoothly.
 *              - Single-timer safety: the interval handle is stored on
 *                window.__nextGateInterval. Re-running the script (e.g., on a
 *                slide revisit) clears any prior interval first, so only one
 *                countdown ever runs at a time.
 *              - Does not touch the interaction-completion variables. Those
 *                continue to be handled by your existing layer/flip-card
 *                triggers. This script is solely responsible for the time gate
 *                and its visible countdown.
 *              - If gateSeconds is missing, zero, or non-numeric, the script
 *                clears the display and sets time_met to true immediately
 *                (fail-open), so a misconfigured slide does not trap the
 *                learner behind a Next button that never enables.
 *
 * Changelog:
 *   1.0.0  (2026-05-21)  Initial release. Wall-clock countdown that drives
 *                        time_met and writes a M:SS display to countdownText.
 * ============================================================================
 */

(function () {
  "use strict";

  /* ----------------------------------------------------------------------
   * CONFIG -- adjust these to taste; no other edits needed per slide.
   * -------------------------------------------------------------------- */
  var CONFIG = {
    // Storyline variable names. Change only if your project uses different
    // variable names than the defaults documented above.
    varGateSeconds:  "gateSeconds",
    varCountdownText: "countdownText",
    varTimeMet:      "time_met",

    // If true, the script writes the full label ("Next enables in: 0:25")
    // into countdownText. If false, it writes only the time ("0:25"), and you
    // supply the "Next enables in:" label in the slide text box.
    includeLabel: false,

    // Text shown once the countdown reaches zero.
    readyMessage: "You may now continue.",

    // Label used when includeLabel is true.
    labelPrefix: "Next enables in: "
  };

  /* ----------------------------------------------------------------------
   * Get the Storyline player object (documented, stable API).
   * -------------------------------------------------------------------- */
  var player = GetPlayer();

  /* ----------------------------------------------------------------------
   * Read the gate duration the slide trigger set in gateSeconds.
   * Fail open: if it is missing/invalid, do not trap the learner. Clear the
   * display and mark the time gate satisfied so Next can enable normally.
   * -------------------------------------------------------------------- */
  var totalSeconds = parseInt(player.GetVar(CONFIG.varGateSeconds), 10);
  if (isNaN(totalSeconds) || totalSeconds <= 0) {
    player.SetVar(CONFIG.varCountdownText, "");
    player.SetVar(CONFIG.varTimeMet, true);
    return;
  }

  /* ----------------------------------------------------------------------
   * Clear any countdown left running from a previous slide so only one
   * interval is ever active.
   * -------------------------------------------------------------------- */
  if (window.__nextGateInterval) {
    clearInterval(window.__nextGateInterval);
    window.__nextGateInterval = null;
  }

  /* ----------------------------------------------------------------------
   * Record the start time on the real (wall-clock) clock. Elapsed time is
   * computed from this on every tick, which keeps the countdown accurate
   * regardless of timeline scrubbing or background-tab timer throttling.
   * -------------------------------------------------------------------- */
  var startTime = Date.now();

  /* ----------------------------------------------------------------------
   * Format a whole number of seconds as M:SS (e.g., 8 -> "0:08").
   * -------------------------------------------------------------------- */
  function formatTime(secs) {
    var m = Math.floor(secs / 60);
    var s = secs % 60;
    return m + ":" + (s < 10 ? "0" + s : s);
  }

  /* ----------------------------------------------------------------------
   * Compute remaining time, update the display, and -- when time is up --
   * set time_met and stop the interval.
   * -------------------------------------------------------------------- */
  function tick() {
    var elapsed = Math.floor((Date.now() - startTime) / 1000);
    var remaining = totalSeconds - elapsed;

    if (remaining > 0) {
      var timeStr = formatTime(remaining);
      player.SetVar(
        CONFIG.varCountdownText,
        CONFIG.includeLabel ? (CONFIG.labelPrefix + timeStr) : timeStr
      );
    } else {
      // Countdown complete: satisfy the time gate and show the ready message.
      player.SetVar(CONFIG.varCountdownText, CONFIG.readyMessage);
      player.SetVar(CONFIG.varTimeMet, true);
      clearInterval(window.__nextGateInterval);
      window.__nextGateInterval = null;
    }
  }

  /* ----------------------------------------------------------------------
   * Show the full time immediately (so the learner sees the starting value
   * without a one-second blank), then update once per second.
   * -------------------------------------------------------------------- */
  tick();
  window.__nextGateInterval = setInterval(tick, 1000);
})();
