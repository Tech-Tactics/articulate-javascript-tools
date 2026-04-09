/**
 * ============================================================================
 * JavaScript Trigger Scene Title in Storyline
 * ============================================================================
 *
 * Purpose:     Reads the current slide's title from the Storyline player,
 *              determines which scene the slide belongs to, and writes the
 *              scene name into a Storyline variable called "SceneTitle".
 *              This lets authors display the current scene name on-slide
 *              (via a text reference to %SceneTitle%) without manually
 *              typing the scene name on every slide.
 *
 *              Storyline does not provide a built-in variable for the
 *              scene name, so this script fills that gap.
 *
 * Author:      Joseph Black
 * Date:        2026-04-08
 * Version:     2.0.0
 *
 * Software:    Articulate Storyline 360 x64 v3.114.36620.0
 *
 * Usage:       Add this script as an "Execute JavaScript" trigger on the
 *              parent Slide Master. It fires each time the timeline
 *              starts. Two Storyline variables are required:
 *                - CurrentSlideTitle  (text, set via Adjust Variable
 *                  trigger to Menu.SlideTitle)
 *                - SceneTitle         (text, this script writes to it)
 *
 * Detection:   The script uses two methods to find the scene name:
 *
 *              Method 1 (Primary) - Internal Data Store:
 *              Reads DS.slideNumberManager.links, which contains the
 *              full course structure with scenes and their child slides.
 *              This works whether the course menu is enabled or not.
 *
 *              Method 2 (Fallback) - Menu DOM:
 *              If the data store is unavailable, the script searches the
 *              player menu DOM for scene headings. This requires the
 *              course menu to be enabled in the player.
 *
 *              If both methods fail, a diagnostic message is written
 *              to SceneTitle for troubleshooting.
 *
 * Notes:       - Works with or without the player menu enabled.
 *              - Works whether player menu numbering is on or off.
 *              - HTML entities in scene names (e.g. &amp;) are decoded
 *                automatically.
 *              - Diagnostic strings (prefixed "ERR", "NO", "BLANK") are
 *                written to SceneTitle when lookups fail, making it easy
 *                to troubleshoot during development.
 *
 * Changelog:   2.0.0 (2026-04-08) - Added primary detection method using
 *                DS.slideNumberManager.links so the script works without
 *                the player menu enabled. Menu DOM lookup is now a
 *                fallback. Handles HTML entity decoding in scene names.
 *              1.0.1 (2026-04-08) - Fixed slide matching to use endsWith
 *                instead of strict equality so menu numbering prefixes
 *                do not break the lookup. Added number prefix stripping
 *                on scene titles.
 *              1.0.0 (2026-04-06) - Initial release.
 * ============================================================================
 */

(function () {

  /* --- Storyline player API reference --- */
  var player = GetPlayer();

  /* --- Retry settings for waiting on data/DOM --- */
  var maxAttempts = 20;   // Maximum number of retries
  var retryDelay  = 150;  // Milliseconds between retries

  /**
   * normalizeText - Collapses all whitespace in a string down to single
   * spaces and trims the ends. Used to safely compare slide titles that
   * may contain extra whitespace or line breaks.
   */
  function normalizeText(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  /**
   * decodeHtmlEntities - Converts HTML entities (e.g. &amp; &lt; &gt;)
   * back to their normal characters. Scene names from the internal data
   * store may contain HTML entities that need to be cleaned up before
   * displaying on-slide.
   */
  function decodeHtmlEntities(str) {
    var el = document.createElement("textarea");
    el.innerHTML = str;
    return el.value;
  }

  /* =======================================================================
   * METHOD 1 (Primary) - Internal Data Store
   *
   * Reads DS.slideNumberManager.links which contains an array of scene
   * objects. Each scene has a displaytext (the scene name) and a links
   * array of child slides, each with their own displaytext (slide name).
   *
   * This data exists whether the player menu is enabled or not.
   * ======================================================================= */

  /**
   * getLinksData - Safely retrieves the links array from the internal
   * data store. Returns null if the data store is not available.
   */
  function getLinksData() {
    try {
      if (typeof DS !== "undefined" &&
          DS.slideNumberManager &&
          DS.slideNumberManager.links &&
          DS.slideNumberManager.links.length > 0) {
        return DS.slideNumberManager.links;
      }
    } catch (e) {}
    return null;
  }

  /**
   * findSceneFromDataStore - Searches the internal data store for a
   * scene that contains a slide matching the current slide title.
   * Returns the decoded scene name, or null if no match is found.
   */
  function findSceneFromDataStore(currentSlideTitle) {
    var links = getLinksData();
    if (!links) return null;

    for (var i = 0; i < links.length; i++) {
      var scene = links[i];
      var children = scene.links;

      if (!children) continue;

      for (var j = 0; j < children.length; j++) {
        var childTitle = normalizeText(decodeHtmlEntities(children[j].displaytext || ""));

        /* Use endsWith to handle cases where the data store includes
           numbering prefixes, and also check strict equality */
        if (childTitle === currentSlideTitle || childTitle.endsWith(currentSlideTitle)) {
          var sceneName = normalizeText(decodeHtmlEntities(scene.displaytext || ""));

          /* Strip leading number prefix if present (e.g. "2. Module 1"
             becomes "Module 1") */
          sceneName = sceneName.replace(/^\d+\.\s*/, "");

          return sceneName || null;
        }
      }
    }

    return null;
  }

  /* =======================================================================
   * METHOD 2 (Fallback) - Menu DOM
   *
   * Searches the player menu for scene headings marked with
   * data-is-scene="true". Requires the course menu to be enabled.
   * ======================================================================= */

  /**
   * isSceneRow - Returns true if a menu list-item represents a scene
   * heading rather than an individual slide. Storyline marks these
   * with a data-is-scene="true" attribute.
   */
  function isSceneRow(row) {
    return row && row.getAttribute("data-is-scene") === "true";
  }

  /**
   * getMenuRows - Returns an array of all menu list-item elements
   * (both scene headings and slide entries) from the player sidebar.
   */
  function getMenuRows() {
    return Array.from(
      document.querySelectorAll('.cs-listitem.listitem[data-slide-title]')
    );
  }

  /**
   * findSceneFromMenuDOM - Searches the player menu DOM for the current
   * slide, then walks backward through the menu rows until it finds a
   * scene heading. Returns the scene name, or a diagnostic string if
   * the lookup fails at any step.
   */
  function findSceneFromMenuDOM(currentSlideTitle) {
    var rows = getMenuRows();

    if (!rows.length) return "NO menu rows";

    /* Filter to slide-only rows and find the current slide.
       Uses endsWith so "8.17. Decision 3" matches "Decision 3"
       when menu numbering is enabled. */
    var slideRows = rows.filter(function (row) {
      return !isSceneRow(row);
    });

    var matchingSlideRow = slideRows.find(function (row) {
      return normalizeText(row.getAttribute("data-slide-title")).endsWith(currentSlideTitle);
    });

    if (!matchingSlideRow) return "NO slide match: " + currentSlideTitle;

    /* Walk backward from the matched slide to find its scene */
    var rowIndex = rows.indexOf(matchingSlideRow);

    if (rowIndex < 0) return "NO row index";

    for (var i = rowIndex - 1; i >= 0; i--) {
      var row = rows[i];

      if (isSceneRow(row)) {
        /* Strip leading number prefix (e.g. "2. Module 1" becomes
           "Module 1") so SceneTitle contains a clean name regardless
           of whether menu numbering is on or off. */
        var sceneTitle = normalizeText(
          row.getAttribute("data-slide-title") || row.textContent
        ).replace(/^\d+\.\s*/, "");

        return sceneTitle || "BLANK scene row";
      }
    }

    return "NO parent scene";
  }

  /* =======================================================================
   * MAIN LOGIC
   *
   * Tries the data store method first. If that fails, falls back to the
   * menu DOM method. If both fail, writes a diagnostic message.
   * ======================================================================= */

  /**
   * updateSceneTitle - Main entry point. Reads the current slide title,
   * then attempts each detection method in order.
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

    /* Step 2: Try the internal data store (works with or without menu) */
    var sceneFromDS = findSceneFromDataStore(currentSlideTitle);
    if (sceneFromDS) {
      player.SetVar("SceneTitle", sceneFromDS);
      return;
    }

    /* Step 3: Fall back to the menu DOM */
    var menuRows = getMenuRows();

    if (!menuRows.length && attempt < maxAttempts) {
      /* Menu may not have rendered yet - retry */
      setTimeout(function () {
        updateSceneTitle(attempt + 1);
      }, retryDelay);
      return;
    }

    var sceneFromMenu = findSceneFromMenuDOM(currentSlideTitle);
    player.SetVar("SceneTitle", sceneFromMenu);
  }

  /* --- Run immediately --- */
  updateSceneTitle();

})();
