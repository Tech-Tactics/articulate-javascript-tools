# JavaScript Trigger Retrieve LMS Name in Storyline

**Author:** Joseph Black
**Version:** 1.0.0
**Tested with:** Articulate Storyline 360 x64 v3.113.36519.0

## What It Does

Pulls the learner's name from the LMS using the SCORM API and reformats it from the standard "Last, First" format to "First Last". The result is stored in a Storyline variable called `lmsName`, which can be displayed on any slide using `%lmsName%` — useful for personalized completion certificates or greeting messages.

## How It Works

1. Calls `lmsAPI.GetStudentName()` to retrieve the name from the LMS (typically returned as "Last, First").
2. Splits the string on the comma into an array.
3. Reassembles the parts as "First Last".
4. Writes the result into the `lmsName` Storyline variable.

## Setup

1. Create a text variable in Storyline named `lmsName`.
2. On the completion slide's Slide Master layout, add a trigger: **Execute JavaScript** → paste the contents of `js-trigger-retrieve-lms-name.js`.
3. Reference the variable on-slide with `%lmsName%` (e.g. "Congratulations, %lmsName%!").

## Requirements

- The course must be hosted in an LMS that exposes the SCORM API.
- This script will **not** work in Storyline preview or standalone published output — `lmsAPI` is only available when the course is launched from an LMS.

## Considerations

- Most LMS platforms return names as "Last, First", but some may differ. If your LMS returns "First Last" already, this script would produce unexpected results — test with your specific LMS.
- The split on the comma may leave a leading space on the first name (e.g. " First"). You could add `.trim()` calls if you see extra whitespace:
  ```js
  let newName = array[1].trim() + ' ' + array[0].trim();
  ```
