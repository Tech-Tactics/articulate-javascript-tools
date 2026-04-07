/**
 * ============================================================================
 * JavaScript Trigger Retrieve LMS Name in Storyline
 * ============================================================================
 *
 * Purpose:     Retrieves the learner's name from the LMS via the SCORM API,
 *              reformats it from "Last, First" to "First Last", and stores
 *              the result in a Storyline variable called "lmsName". This
 *              allows the course to display a personalized greeting or
 *              certificate on a completion slide.
 *
 * Author:      Joseph Black
 * Date:        2026-04-06
 * Version:     1.0.0
 *
 * Software:    Articulate Storyline 360 x64 v3.113.36519.0
 *
 * Usage:       Add this script as an "Execute JavaScript" trigger on the
 *              completion slide's Slide Master layout. A Storyline text
 *              variable named "lmsName" must exist. Reference it on-slide
 *              with %lmsName%.
 *
 * Notes:       - Requires the course to be hosted in an LMS that exposes
 *                the SCORM API (lmsAPI.GetStudentName).
 *              - Will not work in Storyline preview or standalone published
 *                output - the LMS API is only available when launched from
 *                an LMS.
 *              - Assumes the LMS returns the name in "Last, First" format
 *                (comma-separated). If the LMS uses a different format,
 *                the output may need adjustment.
 * ============================================================================
 */

/* Get a reference to the Storyline player API */
let player = GetPlayer();

/* Retrieve the learner's full name from the LMS via the SCORM API.
   Most LMS platforms return this in "Last, First" format. */
let myName = lmsAPI.GetStudentName();

/* Split the name on the comma into an array: ["Last", " First"] */
let array = myName.split(',');

/* Reassemble as "First Last" with a space between.
   array[1] is the first name (may have a leading space from the split),
   so the trim would clean that up if needed. */
let newName = array[1] + ' ' + array[0];

/* Write the reformatted name into the Storyline variable */
player.SetVar("lmsName", newName);
