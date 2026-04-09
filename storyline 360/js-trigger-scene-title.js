/**
 * ============================================================================
 * JavaScript Trigger Scene Title in Storyline
 * ============================================================================
 *
 * Purpose:     Determines which scene the current slide belongs to and
 *              writes the scene name into a Storyline variable called
 *              "SceneTitle". This lets authors display the current scene
 *              name on-slide (via a text reference to %SceneTitle%)
 *              without manually typing the scene name on every slide.
 *
 *              Storyline does not provide a built-in variable for the
 *              scene name, so this script fills that gap.
 *
 * Author:      Joseph Black
 * Date:        2026-04-09
 * Version:     3.0.0
 *
 * Software:    Articulate Storyline 360 x64 v3.114.36620.0
 *
 * Usage:       Add this script as an "Execute JavaScript" trigger on the
 *              parent Slide Master. Set it to fire when the timeline
 *              starts on this slide. Then reference the variable on any
 *              slide using %SceneTitle%.
 *
 *              No other triggers or variables are required. The script
 *              reads the current slide ID and scene name directly from
 *              Storyline's internal data store.
 *
 * Detection:   The script uses three methods and tries them in order:
 *
 *              Method 1 (Primary) - Slide ID Lookup:
 *              Reads the current slide ID from the internal data store
 *              (DS.presentation.attributes.slideMap.currentSlideId),
 *              extracts the scene ID from it, and matches it against
 *              DS.slideNumberManager.links to get the scene name. This
 *              works whether the menu is enabled or not and works on
 *              slides that have been hidden from the menu.
 *
 *              Method 2 (Fallback) - Title Matching via Data Store:
 *              If the slide ID lookup fails, reads the current slide
 *              title from the internal data store and matches it against
 *              the slide names in DS.slideNumberManager.links.
 *
 *              Method 3 (Last Resort) - Menu DOM:
 *              If both data store methods fail, searches the player menu
 *              DOM for scene headings. This requires the course menu to
 *              be enabled in the player.
 *
 * Notes:       - Works with or without the player menu enabled.
 *              - Works on slides that have been hidden from the menu.
 *              - Works whether player menu numbering is on or off.
 *              - No extra triggers or variables are needed beyond the
 *                single Execute JavaScript trigger.
 *              - HTML entities in scene names (e.g. &amp;) are decoded
 *                automatically.
 *              - Diagnostic strings (prefixed "ERR", "NO", "BLANK") are
 *                written to SceneTitle when lookups fail, making it easy
 *                to troubleshoot during development.
 *
 * Changelog:   3.0.0 (2026-04-09) - Rewrote primary detection to use
 *                the current slide ID from the internal data store. The
 *                script no longer requires a CurrentSlideTitle variable
 *                or a Menu.SlideTitle trigger. Works on slides hidden
 *                from the menu. Reduced setup to a single trigger.
 *              2.0.0 (2026-04-08) - Added data store title matching so
 *                the script works without the player menu enabled.
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

  /**
   * cleanSceneName - Decodes HTML entities and strips any leading menu
   * numbering prefix (e.g. "2.  Module 1" becomes "Module 1"). This
   * ensures SceneTitle contains a clean name regardless of whether
   * menu numbering is on or off.
   */
  function cleanSceneName(raw) {
    var decoded = normalizeText(decodeHtmlEntities(raw || ""));
    return decoded.replace(/^\d+\.\s*/, "");
  }

  /* =======================================================================
   * METHOD 1 (Primary) - Slide ID Lookup
   *
   * Reads the current slide ID from the internal data store. The ID is
   * formatted as "sceneId.slideId". The script extracts the scene ID
   * portion and matches it against DS.slideNumberManager.links, which
   * contains scene objects with their display names.
   *
   * This works whether the menu is enabled or not, and it works on
   * slides that have been hidden from the menu.
   * ======================================================================= */

  /**
   * getCurrentSlideId - Safely reads the current slide ID from the
   * internal data store. Returns null if not available.
   */
  function getCurrentSlideId() {
    try {
      var slideMap = DS.presentation.attributes.slideMap;
      if (slideMap && slideMap.currentSlideId) {
        return slideMap.currentSlideId;
      }
    } catch (e) {}
    return null;
  }

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
   * findSceneBySlideId - Extracts the scene ID from the current slide
   * ID and matches it against the links data to find the scene name.
   * Returns the cleaned scene name, or null if no match is found.
   */
  function findSceneBySlideId() {
    var currentId = getCurrentSlideId();
    if (!currentId) return null;

    /* The slide ID is formatted as "sceneId.slideId" */
    var parts = currentId.split(".");
    if (parts.length < 2) return null;

    var sceneId = parts[0];
    var links = getLinksData();
    if (!links) return null;

    /* Match the scene ID against the links. The link slideid is
       formatted as "_player.sceneId" or similar, so we check if
       it contains the scene ID. */
    for (var i = 0; i < links.length; i++) {
      if (links[i].slideid && links[i].slideid.indexOf(sceneId) > -1) {
        var sceneName = cleanSceneName(links[i].displaytext);
        return sceneName || null;
      }
    }

    return null;
  }

  /* =======================================================================
   * METHOD 2 (Fallback) - Title Matching via Data Store
   *
   * If the slide ID lookup fails, this method reads the current slide
   * title from the scene/slide model data and matches it against the
   * child slides in DS.slideNumberManager.links.
   * ======================================================================= */

  /**
   * getCurrentSlideTitleFromDS - Reads the current slide title from the
   * internal data store by finding the slide model in the scenes
   * collection. Returns null if not available.
   */
  function getCurrentSlideTitleFromDS() {
    try {
      var currentId = getCurrentSlideId();
      if (!currentId) return null;

      var parts = currentId.split(".");
      if (parts.length < 2) return null;

      var sceneId = parts[0];
      var slideId = parts[1];

      var scenes = DS.presentation.attributes.scenes.models;
      for (var i = 0; i < scenes.length; i++) {
        if (scenes[i].id === sceneId) {
          var slides = scenes[i].attributes.slides;
          if (slides && slides.models) {
            var found = slides.models.find(function(s) {
              return s.id === slideId;
            });
            if (found && found.attributes && found.attributes.title) {
              return normalizeText(found.attributes.title);
            }
          }
        }
      }
    } catch (e) {}
    return null;
  }

  /**
   * findSceneBySlideTitle - Matches the slide title from the data store
   * against child slides in DS.slideNumberManager.links to find the
   * parent scene name. Returns the cleaned scene name, or null if no
   * match is found.
   */
  function findSceneBySlideTitle() {
    var slideTitle = getCurrentSlideTitleFromDS();
    if (!slideTitle) return null;

    var links = getLinksData();
    if (!links) return null;

    for (var i = 0; i < links.length; i++) {
      var children = links[i].links;
      if (!children) continue;

      for (var j = 0; j < children.length; j++) {
        var childTitle = normalizeText(decodeHtmlEntities(children[j].displaytext || ""));

        if (childTitle === slideTitle || childTitle.endsWith(slideTitle)) {
          var sceneName = cleanSceneName(links[i].displaytext);
          return sceneName || null;
        }
      }
    }

    return null;
  }

  /* =======================================================================
   * METHOD 3 (Last Resort) - Menu DOM
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
   * findSceneFromMenuDOM - Reads the slide title from the data store,
   * searches the player menu DOM for the matching slide, then walks
   * backward to find the scene heading. Returns the scene name or a
   * diagnostic string.
   */
  function findSceneFromMenuDOM() {
    /* Try getting the title from the data store */
    var currentSlideTitle = getCurrentSlideTitleFromDS() || "";

    /* Also try CurrentSlideTitle variable if data store failed */
    if (!currentSlideTitle) {
      try {
        currentSlideTitle = normalizeText(player.GetVar("CurrentSlideTitle"));
      } catch (e) {}
    }

    if (!currentSlideTitle) return "NO slide title available";

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
        var sceneTitle = cleanSceneName(
          row.getAttribute("data-slide-title") || row.textContent
        );
        return sceneTitle || "BLANK scene row";
      }
    }

    return "NO parent scene";
  }

  /* =======================================================================
   * MAIN LOGIC
   *
   * Tries each detection method in order:
   *   1. Slide ID lookup via internal data store
   *   2. Title matching via internal data store
   *   3. Menu DOM search (last resort)
   * ======================================================================= */

  /**
   * updateSceneTitle - Main entry point. Attempts each method and writes
   * the result to the SceneTitle variable.
   */
  function updateSceneTitle(attempt) {
    attempt = attempt || 0;

    /* Method 1: Match by slide ID (works on hidden slides, no menu needed) */
    var sceneById = findSceneBySlideId();
    if (sceneById) {
      player.SetVar("SceneTitle", sceneById);
      return;
    }

    /* Method 2: Match by slide title from data store */
    var sceneByTitle = findSceneBySlideTitle();
    if (sceneByTitle) {
      player.SetVar("SceneTitle", sceneByTitle);
      return;
    }

    /* Method 3: Fall back to menu DOM */
    var menuRows = getMenuRows();

    if (!menuRows.length && attempt < maxAttempts) {
      /* Menu may not have rendered yet - retry */
      setTimeout(function () {
        updateSceneTitle(attempt + 1);
      }, retryDelay);
      return;
    }

    var sceneFromMenu = findSceneFromMenuDOM();
    player.SetVar("SceneTitle", sceneFromMenu);
  }

  /* --- Run immediately --- */
  updateSceneTitle();

})();
