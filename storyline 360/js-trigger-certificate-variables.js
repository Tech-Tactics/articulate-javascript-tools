/**
 * ============================================================================
 * JavaScript Trigger Certificate Variables in Storyline
 * ============================================================================
 *
 * Purpose:     Populates two Storyline variables used on a course completion
 *              certificate:
 *
 *                1. lmsName        - The learner's name, retrieved from the
 *                                    LMS via the SCORM API and reformatted
 *                                    from "Last, First" to "First Last".
 *
 *                2. completionDate - The current date, formatted as
 *                                    "Month D, YYYY" (e.g. "April 23, 2026"),
 *                                    based on the learner's local system
 *                                    clock.
 *
 *              Together these allow the course to display a personalized
 *              completion certificate with the learner's name and the date
 *              they completed the course.
 *
 * Author:      Joseph Black
 * Date:        2026-04-24
 * Version:     1.1.0
 *
 * Software:    Articulate Storyline 360 x64 v3.115.36688.0
 *
 * Usage:       Add this script as a single "Execute JavaScript" trigger on
 *              the certificate slide. Set it to fire when the timeline
 *              starts. Two Storyline text variables must exist:
 *
 *                - lmsName
 *                - completionDate
 *
 *              Reference them on-slide with %lmsName% and %completionDate%.
 *
 * Notes:       - Requires the course to be hosted in an LMS that exposes
 *                the SCORM API (lmsAPI.GetStudentName). The name portion
 *                will not work in Storyline preview or standalone published
 *                output - the LMS API is only available when launched from
 *                an LMS.
 *              - Assumes the LMS returns the name in "Last, First" format
 *                (comma-separated). If the LMS uses a different format,
 *                the parsing logic will need adjustment.
 *              - The date is read from the learner's local system clock,
 *                not a server. If the machine clock is incorrect, the
 *                certificate will reflect that. For centrally managed
 *                workstations this is generally a non-issue.
 *              - If lmsAPI.GetStudentName() throws (e.g. when launched
 *                outside an LMS), the date portion will not run because
 *                the script halts at the error. To guarantee the date
 *                always populates, move the date block above the name
 *                block or wrap the name block in try/catch.
 *
 * Changelog:   1.1.0 (2026-04-24) - Added completionDate variable
 *                generation. Renamed script from "Retrieve LMS Name" to
 *                "Certificate Variables" to reflect the broader purpose.
 *              1.0.0 (2026-04-06) - Initial release: retrieves and
 *                reformats learner name from LMS as lmsName.
 * ============================================================================
 */

/* Get a reference to the Storyline player API */
let player = GetPlayer();

/* ---------- Learner Name ---------- */

/* Retrieve the learner's full name from the LMS via the SCORM API.
   Most LMS platforms return this in "Last, First" format. */
let myName = lmsAPI.GetStudentName();

/* Split the name on the comma into an array: ["Last", " First"] */
let array = myName.split(',');

/* Reassemble as "First Last" with a space between.
   array[1] is the first name (may have a leading space from the split).
   If the LMS leaves leading whitespace, add .trim() calls:
   let newName = array[1].trim() + ' ' + array[0].trim(); */
let newName = array[1] + ' ' + array[0];

/* Write the reformatted name into the Storyline variable */
player.SetVar("lmsName", newName);

/* ---------- Completion Date ---------- */

/* Create a Date object from the learner's local system clock.
   This captures the exact moment the certificate slide loads. */
let today = new Date();

/* Month names array - JavaScript's Date.getMonth() returns 0-11,
   so this lookup converts the zero-based index to a display name. */
let months = ["January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"];

/* Assemble the final display string as "Month D, YYYY".
   To use a different format, modify this assembly line. Common variants:
     MM/DD/YYYY:  (today.getMonth() + 1) + "/" + today.getDate() + "/" + today.getFullYear()
     DD Month YYYY:  today.getDate() + " " + months[today.getMonth()] + " " + today.getFullYear() */
let formatted = months[today.getMonth()] + " " + today.getDate() + ", " + today.getFullYear();

/* Write the formatted date into the Storyline variable */
player.SetVar("completionDate", formatted);
