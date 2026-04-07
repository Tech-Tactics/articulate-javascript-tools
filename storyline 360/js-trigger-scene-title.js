/**
 * ============================================================================
 * JavaScript Trigger Scene Title in Storyline
 * ============================================================================
 *
 * Purpose:     Reads the current slide's title from the Storyline player,
 *              looks up the course menu to find which scene the slide
 *              belongs to, and writes the scene name into a Storyline
 *              variable called "SceneTitle". This lets authors display
 *              the current scene name on-slide (via a text reference to
 *              %SceneTitle%) without hard-coding it per slide.
 *
 * Author:      Joseph Black
 * Date:        2026-04-06
 * Version:     1.0.0
 *
 * Software:    Articulate Storyline 360 x64 v3.113.36519.0
 *
 * Usage:       Add this script as an "Execute JavaScript" trigger on the
 *              top-level Slide Master. It fires each time the timeline
 *              starts. Two Storyline variables are required:
 *                - CurrentSlideTitle  (text, set via built-in or trigger)
 *                - SceneTitle         (text, this script writes to it)
 *
 * Notes:       - The script inspects the player menu DOM to find scene
 *                headings, so the course menu must be enabled.
 *              - If the menu hasn't rendered yet when the script runs,
 *                it retries up to 20 times at 150 ms intervals.
 *              - Diagnostic strings (prefixed "ERR", "NO", "BLANK") are
 *                written to SceneTitle when lookups fail, making it easy
 *                to troubleshoot during development.
 * ============================================================================
 */

(function () {

  /* --- Storyline player API reference --- */
  const player = GetPlayer();

  /* --- Retry settings for waiting on menu DOM --- */
  const maxAttempts = 20;   // Maximum number of retries
  const retryDelay  = 150;  // Milliseconds between retries

  /**
   * normalizeText — Collapses all whitespace in a string down to single
   * spaces and trims the ends. Used to safely compare slide titles that
   * may contain extra whitespace or line breaks in the DOM.
   */
  function normalizeText(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  /**
   * isSceneRow — Returns true if a menu list-item represents a scene
   * heading rather than an individual slide. Storyline marks these
   * with a data-is-scene="true" attribute.
   */
  function isSceneRow(row) {
    return row && row.getAttribute("data-is-scene") === "true";
  }

  /**
   * getMenuRows — Returns an array of all menu list-item elements
   * (both scene headings and slide entries) from the player sidebar.
   */
  function getMenuRows() {
    return Array.from(
      document.querySelectorAll('.cs-listitem.listitem[data-slide-title]')
    );
  }

  /**
   * updateSceneTitle — Main logic. Reads the current slide title from
   * Storyline, finds the matching row in the menu, then walks backward
   * through the menu rows until it hits a scene heading. Writes the
   * result into the "SceneTitle" variable.
   *
   * If the menu DOM isn't ready yet, the function schedules a retry
   * (up to maxAttempts times) before giving up.
   */
  function updateSceneTitle(attempt) {
    attempt = attempt || 0;

    /* Step 1: Read the current slide title from Storyline */
    var currentSlideTitle = "";
    try {
      currentSlideTitle = normalizeText(player.GetVar("CurrentSlideTitle"));
    } catch (e) {
      player.SetVar("SceneTitle", "ERR reading CurrentSlideTitle");
      return;
    }

    if (!currentSlideTitle) {
      player.SetVar("SceneTitle", "NO CurrentSlideTitle");
      return;
    }

    /* Step 2: Get all menu rows from the DOM */
    var rows = getMenuRows();

    if (!rows.length) {
      /* Menu hasn't rendered yet — retry if we have attempts left */
      if (attempt < maxAttempts) {
        setTimeout(function () {
          updateSceneTitle(attempt + 1);
        }, retryDelay);
        return;
      }
      player.SetVar("SceneTitle", "NO menu rows");
      return;
    }

    /* Step 3: Filter to slide-only rows and find the current slide */
    var slideRows = rows.filter(function (row) {
      return !isSceneRow(row);
    });

    var matchingSlideRow = slideRows.find(function (row) {
      return normalizeText(row.getAttribute("data-slide-title")) === currentSlideTitle;
    });

    if (!matchingSlideRow) {
      player.SetVar("SceneTitle", "NO slide match: " + currentSlideTitle);
      return;
    }

    /* Step 4: Walk backward from the matched slide to find its scene */
    var rowIndex = rows.indexOf(matchingSlideRow);

    if (rowIndex < 0) {
      player.SetVar("SceneTitle", "NO row index");
      return;
    }

    for (var i = rowIndex - 1; i >= 0; i--) {
      var row = rows[i];

      if (isSceneRow(row)) {
        var sceneTitle = normalizeText(
          row.getAttribute("data-slide-title") || row.textContent
        );

        if (sceneTitle) {
          player.SetVar("SceneTitle", sceneTitle);
          return;
        }

        player.SetVar("SceneTitle", "BLANK scene row");
        return;
      }
    }

    /* No scene heading found above this slide */
    player.SetVar("SceneTitle", "NO parent scene");
  }

  /* --- Run immediately --- */
  updateSceneTitle();

})();
