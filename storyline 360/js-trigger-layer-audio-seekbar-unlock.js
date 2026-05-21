/**
 * JavaScript Trigger Layer-Audio Seekbar Unlock in Storyline
 *
 * Purpose:  Defeats Storyline's read-only seekbar lock for audio that plays on
 *           a slide LAYER. By default Storyline disables seekbar scrubbing when
 *           layer audio is playing; this lets a learner click or drag the
 *           seekbar to scrub through that layer's audio.
 *
 *           Works in two parts, each pasted into its own JavaScript trigger:
 *             PART 1 (Audio Tracker) - one-time setup. Installs a capture-phase
 *               "play" listener that stores a reference to the most recently
 *               started audio element in window._bopLayerAudio.
 *             PART 2 (Cleanup + Unlock) - runs on slides whose layer audio
 *               should be scrubable. Removes any prior custom handlers, strips
 *               Storyline's lock classes/styles after a short delay, and wires
 *               up custom mouse/pointer/touch handlers that map seekbar position
 *               to audio.currentTime.
 *
 * Author:   Joseph Black  |  Version: 1.0.0
 * Date:     2026-05-21
 * Software: Articulate Storyline 360 x64 v3.116.36838.0
 *
 * WARNING — Storyline internal dependency:
 *   PART 2 depends on undocumented Storyline player CSS class names and DOM
 *   structure (.controls__seekbar, .progress-bar.cs-seekcontrol,
 *   .cs-seekbar-inner, .read-only, .slide-lockable). These are not part of any
 *   public API and may change between Storyline versions. If a Storyline update
 *   changes these classes, the unlock will silently stop working (the seekbar
 *   simply returns to its locked state, with no error). Re-verify after every
 *   Storyline update.
 *
 * Change log:
 *   1.0.0 (2026-05-21) - Initial packaging. Code preserved verbatim from
 *           working project; documentation header and part delimiters added.
 */

/* ====================================================================
 * PART 1 — AUDIO TRACKER  (paste into its own JavaScript trigger;
 *          run once, e.g. on the navigation/how-to slide or course start)
 * ==================================================================== */

// One-time setup. Tracks whichever audio Storyline starts most recently.
if (!window._bopLayerAudioTrackerInstalled) {
  window._bopLayerAudio = null;
  document.addEventListener('play', function(e) {
    if (e.target instanceof HTMLAudioElement) {
      window._bopLayerAudio = e.target;
    }
  }, true); // capture phase, fires before bubbled handlers
  window._bopLayerAudioTrackerInstalled = true;
}


/* ====================================================================
 * PART 2 — CLEANUP + UNLOCK  (paste into its own JavaScript trigger on
 *          each slide whose layer audio should be scrubable)
 * ==================================================================== */

var seekbar = document.querySelector('.controls__seekbar')
           || document.querySelector('[class*="seekbar" i]');
if (seekbar && seekbar._bopHandlers) {
  var h = seekbar._bopHandlers;
  document.removeEventListener('mouseup', h.up, true);
  document.removeEventListener('mousemove', h.move, true);
  seekbar.removeEventListener('mousedown', h.down, true);
  seekbar.removeEventListener('touchend', h.touch, true);
  seekbar._bopHandlers = null;
}

setTimeout(function() {
  var audio = window._bopLayerAudio;
  if (!audio) return;
  var seekbar = document.querySelector('.progress-bar.cs-seekcontrol');
  if (!seekbar) return;
  // Visual unlock — strip Storyline's lock classes and styles
  seekbar.classList.remove('read-only');
  seekbar.style.cursor = 'pointer';
  var inner = seekbar.querySelector('.cs-seekbar-inner');
  if (inner) {
    inner.classList.remove('slide-lockable');
    inner.style.pointerEvents = 'auto';
  }
  // Remove any prior layer-audio handlers
  if (seekbar._bopHandlers) {
    var h = seekbar._bopHandlers;
    document.removeEventListener('mouseup', h.up, true);
    document.removeEventListener('mousemove', h.move, true);
    seekbar.removeEventListener('mousedown', h.down, true);
    seekbar.removeEventListener('pointerdown', h.down, true);
    seekbar.removeEventListener('touchend', h.touch, true);
  }
  function pctFromClientX(clientX) {
    var rect = seekbar.getBoundingClientRect();
    var pct = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, pct));
  }
  function applyPct(pct) {
    if (audio && !isNaN(audio.duration) && audio.duration > 0) {
      audio.currentTime = pct * audio.duration;
    }
  }
  var dragging = false;
  var handlers = {
    down: function(e) {
      dragging = true;
      applyPct(pctFromClientX(e.clientX));
    },
    move: function(e) {
      if (dragging) applyPct(pctFromClientX(e.clientX));
    },
    up: function(e) {
      if (dragging) {
        applyPct(pctFromClientX(e.clientX));
        dragging = false;
      }
    },
    touch: function(e) {
      if (e.changedTouches && e.changedTouches.length) {
        applyPct(pctFromClientX(e.changedTouches[0].clientX));
      }
    }
  };
  // Listen at both pointer and mouse levels for broad compatibility
  seekbar.addEventListener('pointerdown', handlers.down, true);
  seekbar.addEventListener('mousedown', handlers.down, true);
  document.addEventListener('mousemove', handlers.move, true);
  document.addEventListener('mouseup', handlers.up, true);
  seekbar.addEventListener('touchend', handlers.touch, true);
  seekbar._bopHandlers = handlers;
}, 250);
