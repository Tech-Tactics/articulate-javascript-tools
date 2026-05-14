/**
 * JavaScript Trigger Progress Bar Slide Count in Storyline
 *
 * Purpose:  Adds a progress bar with percentage text and a
 *           slide counter to the Storyline 360 player top bar.
 *
 * Author:   Joseph Black  |  Version: 1.0.1
 * Software: Articulate Storyline 360 x64 v3.113.36519.0
 *
 * Change log:
 *   1.0.1 - Slide counter hidden (display:none). Set to "block"
 *           or remove the property to re-enable.
 */

/* ── USER-CONFIGURABLE VARIABLES ─────────────────────────────────── */

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

/* ── INTERNAL LOGIC ──────────────────────────────────────────────── */

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

    const slideCounterText = document.createElement("span");
    slideCounterText.id = "slideCounterText";
    slideCounterText.style.cssText =
      `display:none;position:absolute;left:${slideTextX};top:0;width:${slideTextWidth};text-align:left;font-size:15px;font-weight:600;color:white;`;

    progressBarHolder.appendChild(bgBar);
    progressBarHolder.appendChild(pBar);
    progressBarContainer.appendChild(progressBarText);
    progressBarContainer.appendChild(progressBarHolder);
    progressBarContainer.appendChild(slideCounterText);
    container.appendChild(progressBarContainer);

    if (window.getComputedStyle(container).display === "none") {
      container.style.display = "block";
    }
  }
}

function updateUI() {
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

ensureUI();
updateUI();
setTimeout(updateUI, 150);
setTimeout(updateUI, 400);

if (!window.jbCourseHeaderUpdater) {
  window.jbCourseHeaderUpdater = setInterval(updateUI, 500);
}
