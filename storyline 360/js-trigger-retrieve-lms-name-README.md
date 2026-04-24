# JavaScript Trigger Certificate Variables in Storyline

**Author:** Joseph Black
**Version:** 1.1.0
**Date:** 2026-04-24
**Tested with:** Articulate Storyline 360 x64 v3.115.36688.0

## What It Does

Populates two Storyline variables for use on a course completion certificate:

- **`lmsName`** - Pulls the learner's name from the LMS using the SCORM API and reformats it from "Last, First" to "First Last". This allows the certificate to display the learner's name in a natural order rather than the last-name-first format most LMS platforms return.

- **`completionDate`** - Builds the current date in "Month D, YYYY" format (e.g. "April 23, 2026") from the learner's local system clock. This allows the certificate to show the date the learner completed the course, which is especially useful if they use a print option to save a personal copy.

Both variables can be displayed on-slide using `%lmsName%` and `%completionDate%` text references. Storyline does not provide a built-in variable for the current date, and the built-in `Project.LMSStudentName` variable does not reformat the name, so this script fills both gaps.

## How It Works

### Learner Name

1. Calls `lmsAPI.GetStudentName()` to retrieve the name from the LMS. Most LMS platforms return this in "Last, First" format.
2. Splits the string on the comma into a two-element array.
3. Reassembles the parts as "First Last" with a space between.
4. Writes the result into the `lmsName` Storyline variable.

### Completion Date

1. Creates a JavaScript `Date` object from the learner's local system clock at the moment the certificate slide loads.
2. Looks up the current month name from a months array (JavaScript's `getMonth()` returns 0-11, so the array indexes by zero-based month).
3. Assembles the formatted string as "Month D, YYYY".
4. Writes the result into the `completionDate` Storyline variable.

## Setup

1. In your Storyline project, create two text variables:
   - `lmsName`
   - `completionDate`

   Both should be type Text with blank default values.

2. On the certificate slide, add a trigger:
   - **Action:** Execute JavaScript
   - **When:** Timeline starts on this slide
   - **Script:** Paste the contents of `js-trigger-certificate-variables.js`

3. Reference the variables anywhere on the certificate slide using `%lmsName%` and `%completionDate%`. For example:

```
   Awarded to %lmsName% on %completionDate%
```

That is all that is required. A single trigger populates both variables.

## Requirements

- The course must be hosted in an LMS that exposes the SCORM API for the name portion to work.
- The `lmsAPI` object is only available when the course is launched from an LMS. In Storyline Preview and standalone published output, `lmsName` will be empty or cause a script error.
- The date portion has no external dependencies and will work in any environment that supports JavaScript's built-in `Date` object, which is every modern browser.

## Known Limitations and Considerations

### Name format assumption

The script assumes the LMS returns the name as "Last, First" with a comma separator. Most LMS platforms follow this convention, but not all. If your LMS returns the name in a different format (for example, "First Last" without a comma, or "Last First" without a comma), the parsing logic will produce unexpected output. Test with your specific LMS before shipping.

### Whitespace in the split

When splitting on the comma, the first-name portion often retains a leading space (e.g. the array becomes `["Smith", " John"]`). This reassembles as "John Smith" in practice because the reassembly adds its own space. If your LMS leaves additional whitespace, add `.trim()` calls:

```js
let newName = array[1].trim() + ' ' + array[0].trim();
```

### Date source

The `completionDate` variable reads from the **learner's local system clock**, not from a server. If the learner's machine clock is incorrect, the certificate will reflect the incorrect date. For centrally managed workstations (such as typical BOP or enterprise environments) this is generally a non-issue, but it is worth knowing.

### Script halts on LMS failure

The script executes the name block first and the date block second. If `lmsAPI.GetStudentName()` throws an error (for example, when running outside an LMS), the script halts before reaching the date block and `completionDate` will not populate.

To guarantee the date always populates regardless of LMS availability, either:
- Swap the block order so the date runs first, or
- Wrap the name block in a `try/catch` so a name error does not prevent the date from running.

For the typical use case (certificate slide in an LMS-hosted course), this is not a practical issue.

### No error handling

The script assumes `GetPlayer()` and `lmsAPI` are both available and functional. If either is not (for example, during Storyline Preview), the script will throw. Diagnostic output is not written to the variables on failure. If more robust error handling is needed, wrap each block in `try/catch` and write a diagnostic string to the relevant variable.

### Preview vs. published behavior

The date portion works in Storyline Preview because it only depends on the browser's built-in `Date` object. The name portion does not work in Preview because `lmsAPI` is only injected when the course is launched from an LMS. To test the full script, publish and run the course inside your target LMS.

## Customizing the Date Format

To change the date format, modify the final assembly line in the date block. Common variants:

```js
// "04/23/2026"
let formatted = (today.getMonth() + 1) + "/" + today.getDate() + "/" + today.getFullYear();

// "23 April 2026"
let formatted = today.getDate() + " " + months[today.getMonth()] + " " + today.getFullYear();

// "2026-04-23" (ISO-like)
let pad = function(n) { return n < 10 ? "0" + n : n; };
let formatted = today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate());
```

The default format ("Month D, YYYY") is chosen for certificates because it reads naturally and doesn't require locale interpretation the way MM/DD vs DD/MM does.

## Troubleshooting

If `%lmsName%` is blank on the certificate:
- Confirm the course is launched from an LMS, not from a local file or Preview.
- Confirm the LMS is SCORM-compliant and exposes `cmi.core.student_name`.
- Add a temporary text box with just `%lmsName%` and verify the variable exists and is being set. If it exists but is blank, the script may be failing silently at `lmsAPI.GetStudentName()`.

If `%completionDate%` is blank on the certificate:
- Confirm the `completionDate` variable exists in the project variables panel with exactly that name (case-sensitive).
- Confirm the trigger is set to fire on **Timeline starts on this slide**, not some other condition.
- If the name block is failing before the date block runs, swap the block order or add `try/catch` around the name block (see "Script halts on LMS failure" above).

If the name appears in "Last First" order instead of "First Last":
- Your LMS may not be returning the name in the expected "Last, First" format. Check what `lmsAPI.GetStudentName()` actually returns by temporarily setting `lmsName` to the raw value:
```js
  player.SetVar("lmsName", lmsAPI.GetStudentName());
```
- Adjust the parsing logic based on what you see.

## Changelog

### 1.1.0 (2026-04-24)
- **New:** Added `completionDate` variable generation. Builds the current date in "Month D, YYYY" format from the learner's local system clock.
- **Changed:** Renamed script and documentation from "Retrieve LMS Name" to "Certificate Variables" to reflect the broader purpose.
- **Changed:** Expanded inline comments and documentation to match the depth of the original.

### 1.0.0 (2026-04-06)
- Initial release: retrieves and reformats learner name from LMS as `lmsName`.
