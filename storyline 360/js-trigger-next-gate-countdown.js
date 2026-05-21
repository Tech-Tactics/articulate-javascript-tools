/**
 * JavaScript Trigger Next-Gate Countdown in Storyline
 *
 * Purpose:  Displays a live "M:SS" countdown for how long until the Next
 *           button becomes available on a time-gated slide, and (optionally)
 *           drives the time portion of the gate by setting "time_met" when the
 *           countdown reaches zero. The countdown runs on real wall-clock time
 *           rather than the slide timeline, so it cannot be shortened by
 *           dragging the seekbar to the end of the timeline.
 *
 *           Reads the gate length from a Storyline Number variable so one
 *           script works on every gated slide without editing the code. The
 *           display value is written to a Text variable that an on-slide text
 *           box references, keeping look-and-feel under Storyline's control.
 *
 * Author:   Joseph Black  |  Version: 1.0.0
 * Date:     2026-05-21
 * Software: Articulate Storyline 360 x64 v3.116.36838.0
 *
 * Change log:
 *   1.0.0 (2026-05-21) - Initial release. Wall-clock countdown; writes M:SS to
 *           timeLeft and (when CONFIG.setTimeMet is true) sets time_met at zero.
 */

/* ── USER-CONFIGURABLE VARIABLES ─────────────────────────────────── */

/* Storyline variable names. Change only if your project differs. */
const waitTimeVar  = "waitTime";   // Number  (input)  total gate length, seconds
const timeLeftVar  = "timeLeft";   // Text    (output) the M:SS display string
const timeMetVar   = "time_met";   // T/F     (output) gate flag set at zero

/* When true, the script sets time_met to true once the countdown completes.
   Set to false for a display-only countdown (e.g. if the time gate is handled
   elsewhere, or if the seekbar is removed so no wall-clock gate is needed). */
const setTimeMet   = true;

/* Text shown when the countdown reaches zero. */
const readyMessage = "You may now continue.";

/* ── INTERNAL LOGIC ──────────────────────────────────────────────── */

const player = GetPlayer();

function getRawVar(varName) {
  try { return player.GetVar(varName); } catch (e) { return null; }
}

function getNumVar(varName, fallback) {
  const num = Number(getRawVar(varName));
  return Number.isFinite(num) ? num : fallback;
}

/* Read the gate length set by the slide's "Set waitTime" trigger. */
const totalSeconds = getNumVar(waitTimeVar, 0);

/* Fail open: if waitTime is missing/zero/invalid, clear the display and (if
   enabled) mark the time gate satisfied, so a misconfigured slide never traps
   the learner behind a Next button that will not enable. */
if (totalSeconds <= 0) {
  try { player.SetVar(timeLeftVar, ""); } catch (e) {}
  if (setTimeMet) { try { player.SetVar(timeMetVar, true); } catch (e) {} }
} else {

  /* Clear any countdown left running from a previous slide so only one
     interval is ever active (single-timer guard, jb-prefixed to match the
     course-header script's window.jbCourseHeaderUpdater convention). */
  if (window.jbGateCountdown) {
    clearInterval(window.jbGateCountdown);
    window.jbGateCountdown = null;
  }

  /* Real wall-clock start time. Elapsed is recomputed on every tick, which
     keeps the value accurate regardless of seekbar scrubbing or background-tab
     timer throttling. */
  const startTime = Date.now();

  /* Format whole seconds as M:SS (e.g. 8 -> "0:08"). */
  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m + ":" + (s < 10 ? "0" + s : s);
  }

  /* Compute remaining time, update the display, and at zero set the gate. */
  function tick() {
    const elapsed   = Math.floor((Date.now() - startTime) / 1000);
    const remaining = totalSeconds - elapsed;

    if (remaining > 0) {
      try { player.SetVar(timeLeftVar, formatTime(remaining)); } catch (e) {}
    } else {
      try { player.SetVar(timeLeftVar, readyMessage); } catch (e) {}
      if (setTimeMet) { try { player.SetVar(timeMetVar, true); } catch (e) {} }
      clearInterval(window.jbGateCountdown);
      window.jbGateCountdown = null;
    }
  }

  /* Show the starting value immediately, then update once per second. */
  tick();
  window.jbGateCountdown = setInterval(tick, 1000);
}
