/**
 * ============================================================================
 * JavaScript Trigger Progress Bar Slide Count in Storyline
 * ============================================================================
 *
 * Purpose:     Injects a dynamic progress bar with percentage text and a
 *              slide counter (e.g. "Slide: 3/12") into the Storyline 360
 *              course player chrome. Eliminates the need for on-slide
 *              progress elements or a dedicated completion page.
 *
 * Author:      [Your Name]
 * Date:        2026-04-06
 * Version:     1.0.0
 *
 * Software:    Articulate Storyline 360 x64 v3.113.36519.0
 *
 * Usage:       Add this script as an "Execute JavaScript" trigger on the
 *              top-level Slide Master. It fires each time the timeline
 *              starts. A Storyline variable named "Progress" (case-
 *              sensitive) must be set equal to the built-in
 *              Menu.Progress or Project.Progress via an "Adjust Variable"
 *              trigger on the same master slide.
 *
 * Notes:       - The player must have at least one right-side element
 *                (Resources, Glossary, etc.) or use a workaround to
 *                keep the "links-right" container visible.
 *              - This script renders in Storyline's built-in preview
 *                and in published output.
 * ============================================================================
 */

/* -----------------------------------------------------------------------
 * USER-CONFIGURABLE VARIABLES
 * Change these to match your course's visual design.
 * ----------------------------------------------------------------------- */

const container   = document.getElementById("links-right"); // Player top-bar container
const bgColor     = "#F6F9FB";  // Track background color
const barColor    = "#FCCE4B";  // Progress fill color
const compColor   = "#19BB32";  // Fill color when progress reaches 100%
const borderRad   = "100px";    // Border radius for rounded bar ends
const progressVar = "Progress"; // Storyline variable name (case-sensitive)

/* Fallback Storyline variables — only used if the built-in slide number
   variables (MenuSection.SlideNumber / MenuSection.TotalSlides) are not
   readable via JavaScript. Create these manually if needed. */
const fallbackCurrentSlideVar = "CurrentSlide";
const fallbackTotalSlidesVar  = "TotalSlides";

/* -----------------------------------------------------------------------
 * LAYOUT SETTINGS
 * Adjust pixel values to reposition or resize the UI elements within
 * the player bar.
 * ----------------------------------------------------------------------- */

const wrapperX         = "20px";   // Horizontal offset of the entire widget
const wrapperY         = "0px";    // Vertical offset of the entire widget

const progressTextWidth = "190px"; // Width allocated for "Course Progress: XX%"
const barWidth          = "220px"; // Width of the progress bar itself
const barHeight         = "15px";  // Height of the progress bar
const slideTextWidth    = "95px";  // Width allocated for "Slide: X/Y"

const barX              = "200px"; // Left offset of the bar from the wrapper
const slideTextX        = "440px"; // Left offset of the slide counter text

/* -----------------------------------------------------------------------
 * INTERNAL LOGIC — edit below only if you understand the structure
 * ----------------------------------------------------------------------- */

/* Get a reference to the Storyline player API */
const player = GetPlayer();

/**
 * getRawVar — Safely read any Storyline variable by name.
 * Returns null if the variable does not exist or throws an error.
 */
function getRawVar(varName) {
  try {
    return player.GetVar(varName);
  } catch (e) {
    return null;
  }
}

/**
 * getNumVar — Read a Storyline variable and coerce it to a number.
 * Returns the provided fallback value if the variable is missing or
 * not a finite number.
 */
function getNumVar(varName, fallback) {
  const raw = getRawVar(varName);
  const num = Number(raw);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * getProgressValue — Returns the current progress percentage, clamped
 * between 0 and 100.
 */
function getProgressValue() {
  return Math.max(0, Math.min(100, getNumVar(progressVar, 0)));
}

/**
 * getSlideValues — Attempts to read the current slide number and total
 * slide count. Tries Storyline's built-in variables first, then falls
 * back to user-created variables if the built-ins aren't available.
 *
 * Returns an object: { current, total, source }
 *   source is "built-in", "fallback", or "none"
 */
function getSlideValues() {
  /* Try built-in variables first */
  const builtInCurrent = getNumVar("MenuSection.SlideNumber", NaN);
  const builtInTotal   = getNumVar("MenuSection.TotalSlides", NaN);

  if (Number.isFinite(builtInCurrent) && Number.isFinite(builtInTotal) && builtInTotal > 0) {
    return { current: builtInCurrent, total: builtInTotal, source: "built-in" };
  }

  /* Fall back to manually created Storyline variables */
  const fbCurrent = getNumVar(fallbackCurrentSlideVar, NaN);
  const fbTotal   = getNumVar(fallbackTotalSlidesVar, NaN);

  if (Number.isFinite(fbCurrent) && Number.isFinite(fbTotal) && fbTotal > 0) {
    return { current: fbCurrent, total: fbTotal, source: "fallback" };
  }

  return { current: null, total: null, source: "none" };
}

/* -----------------------------------------------------------------------
 * ensureUI — Creates the DOM elements for the progress widget if they
 * don't already exist. On subsequent slide loads the existing elements
 * are reused and only their values are updated (see updateUI).
 * ----------------------------------------------------------------------- */
function ensureUI() {
  let progressBarContainer = document.getElementById("progressBarContainer");

  if (!progressBarContainer) {

    /* --- Outer wrapper --- */
    progressBarContainer = document.createElement("div");
    progressBarContainer.id = "progressBarContainer";
    progressBarContainer.style.height         = "20px";
    progressBarContainer.style.position       = "relative";
    progressBarContainer.style.transform      = "translate(" + wrapperX + "," + wrapperY + ")";
    progressBarContainer.style.whiteSpace     = "nowrap";

    /* --- "Course Progress: XX%" label --- */
    const progressBarText = document.createElement("span");
    progressBarText.id                = "progressBarText";
    progressBarText.style.position    = "absolute";
    progressBarText.style.left        = "0px";
    progressBarText.style.top         = "0px";
    progressBarText.style.width       = progressTextWidth;
    progressBarText.style.textAlign   = "right";
    progressBarText.style.fontSize    = "15px";
    progressBarText.style.fontWeight  = "600";
    progressBarText.style.color       = "white";

    /* --- Bar holder (contains bg track + fill) --- */
    const progressBarHolder = document.createElement("div");
    progressBarHolder.id             = "progressBarHolder";
    progressBarHolder.style.position = "absolute";
    progressBarHolder.style.left     = barX;
    progressBarHolder.style.top      = "3px";
    progressBarHolder.style.width    = barWidth;
    progressBarHolder.style.height   = barHeight;

    /* Background track */
    const bgBar = document.createElement("div");
    bgBar.id                       = "bgBar";
    bgBar.style.position           = "absolute";
    bgBar.style.left               = "0";
    bgBar.style.top                = "0";
    bgBar.style.width              = "100%";
    bgBar.style.height             = "100%";
    bgBar.style.backgroundColor    = bgColor;
    bgBar.style.borderRadius       = borderRad;

    /* Progress fill */
    const pBar = document.createElement("div");
    pBar.id                    = "pBar";
    pBar.style.position        = "absolute";
    pBar.style.left            = "0";
    pBar.style.top             = "0";
    pBar.style.height          = "100%";
    pBar.style.borderRadius    = borderRad;

    /* --- "Slide: X/Y" label --- */
    const slideCounterText = document.createElement("span");
    slideCounterText.id                = "slideCounterText";
    slideCounterText.style.position    = "absolute";
    slideCounterText.style.left        = slideTextX;
    slideCounterText.style.top         = "0px";
    slideCounterText.style.width       = slideTextWidth;
    slideCounterText.style.textAlign   = "left";
    slideCounterText.style.fontSize    = "15px";
    slideCounterText.style.fontWeight  = "600";
    slideCounterText.style.color       = "white";

    /* Assemble the DOM tree */
    progressBarHolder.appendChild(bgBar);
    progressBarHolder.appendChild(pBar);

    progressBarContainer.appendChild(progressBarText);
    progressBarContainer.appendChild(progressBarHolder);
    progressBarContainer.appendChild(slideCounterText);

    container.appendChild(progressBarContainer);

    /* Force the player container visible if Storyline hid it */
    const containerDisplay = window.getComputedStyle(container).getPropertyValue("display");
    if (containerDisplay === "none") {
      container.style.display = "block";
    }
  }
}

/* -----------------------------------------------------------------------
 * updateUI — Reads the latest variable values from Storyline and pushes
 * them into the DOM elements created by ensureUI().
 * ----------------------------------------------------------------------- */
function updateUI() {
  const progressValue = getProgressValue();
  const slideValues   = getSlideValues();

  const progressBarText  = document.getElementById("progressBarText");
  const slideCounterText = document.getElementById("slideCounterText");
  const pBar             = document.getElementById("pBar");

  /* Update percentage label */
  if (progressBarText) {
    progressBarText.textContent = "Course Progress: " + progressValue + "%";
  }

  /* Update slide counter label */
  if (slideCounterText) {
    if (slideValues.current !== null && slideValues.total !== null) {
      slideCounterText.textContent = "Slide: " + slideValues.current + "/" + slideValues.total;
    } else {
      slideCounterText.textContent = "Slide: --/--";
    }
  }

  /* Update bar width and color */
  if (pBar) {
    pBar.style.width           = progressValue + "%";
    pBar.style.backgroundColor = (progressValue === 100 && compColor) ? compColor : barColor;
  }
}

/* -----------------------------------------------------------------------
 * INITIALIZATION
 * Build the UI, then update it immediately. The short delayed calls
 * catch cases where Storyline's own scripts modify variables slightly
 * after the timeline starts. The setInterval keeps the display in sync
 * if variables change mid-slide (e.g. from layer triggers).
 * ----------------------------------------------------------------------- */

ensureUI();
updateUI();

setTimeout(updateUI, 150);
setTimeout(updateUI, 400);

/* Register a recurring updater only once per session */
if (!window.jbCourseHeaderUpdater) {
  window.jbCourseHeaderUpdater = setInterval(updateUI, 500);
}
