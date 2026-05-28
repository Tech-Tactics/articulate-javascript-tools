/**
 * JavaScript Trigger Player Header in Storyline
 *
 * Purpose:  Renders course-level chrome into the Storyline 360 player top bar:
 *             1. A percentage progress bar with "Course Progress: XX%" label.
 *             2. (Optional) A slide counter "Slide: X/Y" — hidden by default.
 *             3. (Optional) A live "Next enables in: M:SS" countdown that
 *                tracks the current slide's timeline duration, displays only
 *                on time-gated slides, and switches to "You may now continue."
 *                when the Next button is enabled.
 *
 *           All three render into the player's `links-right` container as
 *           injected DOM, share the same persistent setInterval, and use the
 *           same font/weight/color for visual consistency.
 *
 * Author:   Joseph Black  |  Version: 2.0.0
 * Date:     2026-05-28
 * Software: Articulate Storyline 360 x64 v3.118.37003.0
 *
 * WARNING - Storyline internal dependencies (countdown only):
 *   The countdown reads the current slide via undocumented runtime paths:
 *     DS.windowManager.getCurrentWindow().getCurrentSlide()
 *        .attributes.currentTimeline.attributes.duration   (milliseconds)
 *     slide.absoluteId   (for slide-change detection across ticks)
 *   The countdown also reads the Next button's disabled state from the DOM:
 *     document.getElementById("next").classList.contains("cs-disabled")
 *   None of this is public Storyline API. If a Storyline update changes
 *   these paths, the countdown silently hides (fail-safe). The progress bar
 *   and slide counter are unaffected by this dependency. Confirmed working
 *   on v3.116.36838.0 and v3.118.37003.0. Re-verify the DS path after every
 *   Storyline update.
 *
 * Change log:
 *   2.0.0 (2026-05-28) - Renamed from js-trigger-progress-bar-slide-count to
 *           js-trigger-player-header to reflect that the script now manages
 *           multiple player-header indicators, not just the progress bar.
 *           Added Next-Gate countdown indicator. Reads the current slide's
 *           timeline duration from the DS runtime, counts down on wall-clock
 *           time, displays only when timeline >= minSecondsToShow seconds and
 *           a Next button exists. Hides on knowledge-check / completion slides
 *           (no #next element) and when time is done but Next is still
 *           disabled (interactions pending). Switches to a ready message when
 *           Next becomes enabled. waitTime variable supported as a fallback
 *           and as a per-slide override. Confirmed on Storyline v3.118.37003.0.
 *           New CONFIG: showCountdown, waitTimeVar, minSecondsToShow,
 *           labelPrefix, readyMessage, countdownX, countdownTextWidth,
 *           waitTimeOverrides.
 *   1.0.1 (2026-05-14) - Slide counter hidden (display:none).
 *           Set to "block" or remove the property to re-enable.
 */

/* -- USER-CONFIGURABLE VARIABLES --------------------------------- */

const container   = document.getElementById("links-right");
const bgColor     = "#F6F9FB";
const barColor    = "#FCCE4B";
const compColor   = "#19BB32";
const borderRad   = "100px";
const progressVar = "Progress";

const fallbackCurrentSlideVar = "CurrentSlide";
const fallbackTotalSlidesVar  = "TotalSlides";

const wrapperX          = "20px";
const wrapperY          = "0px";
const progressTextWidth = "190px";
const barWidth          = "220px";
const barHeight         = "15px";
const slideTextWidth    = "95px";
const barX              = "200px";
const slideTextX        = "440px";

/* Countdown feature (set showCountdown to false to hide it entirely) */
const showCountdown      = true;
const waitTimeVar        = "waitTime";              // Number, optional fallback/override (seconds)
const minSecondsToShow   = 10;                      // Don't show countdown on shorter slides
const labelPrefix        = "Next enables in: ";
const readyMessage       = "You may now continue.";
const countdownX         = "440px";                 // Left offset within wrapper
const countdownTextWidth = "220px";
const waitTimeOverrides  = false;                   // true = waitTime variable overrides timeline duration

/* -- INTERNAL LOGIC ---------------------------------------------- */

const player = GetPlayer();

function getRawVar(varName) {
  try { return player.GetVar(varName); } catch (e) { return null; }
}

function getNumVar(varName, fallback) {
  const num = Number(getRawVar(varName));
  return Number.isFinite(num) ? num : fallback;
}

function getProgressValue() {
  return Math.max(0, Math.min(100, getNumVar(progressVar, 0)));
}

function getSlideValues() {
  const builtInCurrent = getNumVar("MenuSection.SlideNumber", NaN);
  const builtInTotal   = getNumVar("MenuSection.TotalSlides", NaN);
  if (Number.isFinite(builtInCurrent) && Number.isFinite(builtInTotal) && builtInTotal > 0) {
    return { current: builtInCurrent, total: builtInTotal, source: "built-in" };
  }
  const fbCurrent = getNumVar(fallbackCurrentSlideVar, NaN);
  const fbTotal   = getNumVar(fallbackTotalSlidesVar, NaN);
  if (Number.isFinite(fbCurrent) && Number.isFinite(fbTotal) && fbTotal > 0) {
    return { current: fbCurrent, total: fbTotal, source: "fallback" };
  }
  return { current: null, total: null, source: "none" };
}

/* Read current slide ID and timeline duration (seconds) from the Storyline
   runtime. Returns null if the undocumented path is unavailable, so callers
   can hide gracefully. */
function getCurrentSlideInfo() {
  try {
    const slide = DS.windowManager.getCurrentWindow().getCurrentSlide();
    const ms    = slide.attributes.currentTimeline.attributes.duration;
    const secs  = Math.round(Number(ms) / 1000);
    return {
      id: slide.absoluteId,
      duration: (Number.isFinite(secs) && secs > 0) ? secs : NaN
    };
  } catch (e) {
    return null;
  }
}

/* Persistent state for the countdown across ticks of the main loop. */
let cdLastSlideId = null;
let cdStartTime   = null;
let cdDuration    = 0;

/* Format whole seconds as M:SS (e.g. 8 -> "0:08"). */
function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m + ":" + (s < 10 ? "0" + s : s);
}

function ensureUI() {
  let progressBarContainer = document.getElementById("progressBarContainer");
  if (!progressBarContainer) {
    progressBarContainer = document.createElement("div");
    progressBarContainer.id = "progressBarContainer";
    progressBarContainer.style.cssText =
      `height:20px;position:relative;transform:translate(${wrapperX},${wrapperY});white-space:nowrap;`;

    const progressBarText = document.createElement("span");
    progressBarText.id = "progressBarText";
    progressBarText.style.cssText =
      `position:absolute;left:0;top:0;width:${progressTextWidth};text-align:right;font-size:15px;font-weight:600;color:white;`;

    const progressBarHolder = document.createElement("div");
    progressBarHolder.id = "progressBarHolder";
    progressBarHolder.style.cssText =
      `position:absolute;left:${barX};top:3px;width:${barWidth};height:${barHeight};`;

    const bgBar = document.createElement("div");
    bgBar.id = "bgBar";
    bgBar.style.cssText =
      `position:absolute;left:0;top:0;width:100%;height:100%;background:${bgColor};border-radius:${borderRad};`;

    const pBar = document.createElement("div");
    pBar.id = "pBar";
    pBar.style.cssText =
      `position:absolute;left:0;top:0;height:100%;border-radius:${borderRad};`;

    /* Slide counter hidden (display:none) — change to "block" to re-enable.
       Note: shares the same default left offset as the countdown. If you
       re-enable the slide counter, also adjust countdownX (or slideTextX) so
       they don't overlap. */
    const slideCounterText = document.createElement("span");
    slideCounterText.id = "slideCounterText";
    slideCounterText.style.cssText =
      `display:none;position:absolute;left:${slideTextX};top:0;width:${slideTextWidth};text-align:left;font-size:15px;font-weight:600;color:white;`;

    /* Countdown text — created hidden; the main loop toggles display:block
       and writes content based on current slide state. */
    const countdownTextEl = document.createElement("span");
    countdownTextEl.id = "countdownText";
    countdownTextEl.style.cssText =
      `display:none;position:absolute;left:${countdownX};top:0;width:${countdownTextWidth};text-align:left;font-size:15px;font-weight:600;color:white;`;

    progressBarHolder.appendChild(bgBar);
    progressBarHolder.appendChild(pBar);
    progressBarContainer.appendChild(progressBarText);
    progressBarContainer.appendChild(progressBarHolder);
    progressBarContainer.appendChild(slideCounterText);
    progressBarContainer.appendChild(countdownTextEl);
    container.appendChild(progressBarContainer);

    if (window.getComputedStyle(container).display === "none") {
      container.style.display = "block";
    }
  }
}

function updateProgressAndSlideCount() {
  const progressValue = getProgressValue();
  const slideValues   = getSlideValues();

  const progressBarText  = document.getElementById("progressBarText");
  const slideCounterText = document.getElementById("slideCounterText");
  const pBar             = document.getElementById("pBar");

  if (progressBarText) progressBarText.textContent = "Course Progress: " + progressValue + "%";
  if (slideCounterText) {
    slideCounterText.textContent = slideValues.current !== null
      ? "Slide: " + slideValues.current + "/" + slideValues.total
      : "Slide: --/--";
  }
  if (pBar) {
    pBar.style.width = progressValue + "%";
    pBar.style.backgroundColor = (progressValue === 100 && compColor) ? compColor : barColor;
  }
}

function updateCountdown() {
  const el = document.getElementById("countdownText");
  if (!el) return;

  /* Master switch off → never show. */
  if (!showCountdown) {
    el.style.display = "none";
    return;
  }

  /* No Storyline slide info available → fail-safe hide. */
  const slideInfo = getCurrentSlideInfo();
  if (!slideInfo) {
    el.style.display = "none";
    return;
  }

  /* Determine countdown length:
     - If waitTimeOverrides is true, use waitTime variable when > 0.
     - Otherwise use the timeline duration, fall back to waitTime if invalid. */
  const manual = getNumVar(waitTimeVar, 0);
  let totalSeconds;
  if (waitTimeOverrides && manual > 0) {
    totalSeconds = manual;
  } else if (Number.isFinite(slideInfo.duration)) {
    totalSeconds = slideInfo.duration;
  } else if (manual > 0) {
    totalSeconds = manual;
  } else {
    totalSeconds = 0;
  }

  /* Below the threshold for showing a countdown → hide. Catches short slides
     where a timer would be more distracting than helpful. */
  if (totalSeconds < minSecondsToShow) {
    el.style.display = "none";
    return;
  }

  /* No Next button on this slide (knowledge check, certificate, etc.) →
     not a Next-gated slide, so no countdown. */
  const nextBtn = document.getElementById("next");
  if (!nextBtn) {
    el.style.display = "none";
    return;
  }

  /* Detect slide change. Each new slide gets a fresh wall-clock start time. */
  if (slideInfo.id !== cdLastSlideId) {
    cdLastSlideId = slideInfo.id;
    cdStartTime   = Date.now();
    cdDuration    = totalSeconds;
  }

  /* Compute remaining time and decide what to display. */
  const elapsed   = Math.floor((Date.now() - cdStartTime) / 1000);
  const remaining = cdDuration - elapsed;
  const nextDisabled = nextBtn.classList.contains("cs-disabled");

  if (remaining > 0) {
    /* Still counting → show the timer (regardless of Next state, because the
       timer is still relevant either way). */
    el.style.display = "block";
    el.textContent = labelPrefix + formatTime(remaining);
  } else if (!nextDisabled) {
    /* Time done AND Next is enabled (first-visit complete, or revisit) →
       confirm the learner can proceed. */
    el.style.display = "block";
    el.textContent = readyMessage;
  } else {
    /* Time done but Next is still disabled (interactions still pending) →
       hide. The slide's own visuals (unclicked flip cards, etc.) communicate
       what's left to do. */
    el.style.display = "none";
  }
}

function updateUI() {
  updateProgressAndSlideCount();
  updateCountdown();
}

ensureUI();
updateUI();
setTimeout(updateUI, 150);
setTimeout(updateUI, 400);

if (!window.jbCourseHeaderUpdater) {
  window.jbCourseHeaderUpdater = setInterval(updateUI, 500);
}
