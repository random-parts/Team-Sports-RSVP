# Team-Sports-RSVP
Google Sheets add-on for ezleagues.ezfacility.com team schedules

Google Sheets add-on link:

https://chrome.google.com/webstore/detail/team-sports-rsvp/ijpfbndfefefamogmomfgllnomhcgghm

---
### Getting Started

**Install options (pick one):**

- Use the link above to install the add-on from the chrome webstore
- Fork/Clone this repo and use [node-google-apps-script](https://www.npmjs.com/package/node-google-apps-script) to add the script to your Google Apps Script project
- Copy & paste the script into a new Google Apps Script file

**Set-up a new season sheet:**

- Navigate to the Add-on menu and find the `Team Sports RSVP` option. 
- Select the `Start New Season` option to activate sheet set-up. 
- Enter a name for the new sheet when prompted. **Must be a unique name**
- Enter the web link to your Teams current schedule page from a ezleagues.ezfacility.com league when prompted
- A completion alert will let you know when set-up is finished.
- Fill in the roster list with names and email addresses.
- At the start of the new season, run the menu option again and a new season sheet will be set up. Any roster members that replied positively to the playing `Next?` season column will be transferred to the new sheet. 

**Manual task running (Advanced Options):**

- The sheet schedule should auto-update as the website updates. However, it may not if a copy of the spreadsheet is [open in restricted views][1]. It is possible to run updates using the `Advanced Options>Run schedule update` option.
- 3 days and 1 day before the next gameday, the email task will process who has not yet rsvp'd to the game and will send an automated email reminder with the option to set their intention from within that email. If you feel a need to send the emails more often, the `Advanced Options>Send Next Gameday Emails` is available to run the process immediately.
- Send email reminders to pay player fees and to ask if current team members will be returning next season by running: `Advanced Options>Send Payment Due Emails` & `Advanced Options>Send Returning? Emails`

**Google Sheets share permissions**

- Share the sheet using the **"Anyone with the link can edit"** permission for optimal user experience. The script's Sheet protections allow for editing within certain ranges with data validation. This allows team members to update their status without having to first login to Google or to have a Google account, while still protecting the integrity of the sheet.

---
### Change Log

v 1.3.18

Fixes

- Added `SpreadsheetApp.flush()` to force the spreadsheet event queue to process before moving on. Should correct random errors during long processes (onDailyTrigger()) from trampling ahead of the spreadsheet events.


v 1.3.17

- Overhaul of Email Service task:
    - Processes Bye-Week emails when the schedule has a common (2/3rd majority) game-day.
    - New email type to ask current roster if they are returning `Next` season.
    - New email type to send payment reminders for current roster slots that have not been marked as `Paid`.
    - Updated `Add-on` menu to manually send `Payment` and `Returning?` emails.
    - New and updated `email_html` templates; emails will show the next `active` game and field if applicable.
    - onDailyTrigger() will now send the Sheet Owner a `sent email log` showing what emails were sent from that Spreadsheet in the past 24hrs.

- New `storageBean` to handle `DocumentProperties` consistently.
- Added `utils().date.format()` to handle date formatting consistently.
- There is now a script updater that will check for major and minor version updates and run an `update()` to set or change any new properties/settings as needed.


Fixes

- New season roster copy will now remove stale values in the Next and Paid columns


v1.2.15

Fixes

- Will now check for and require a unique name on sheet/season creation
- Empty roster rows will no longer cause a sending email error
- RSVP Email service will look beyond the next gameday and send emails for any game within the settings time frame  [default: 1 & 3 days before game]
- Game headers will now format properly on cancelled games


v1.2.12

- Displays the Venue/Field name.
- Past game columns [rsvp cells & opponent cell] are now grayed out.

Fixes

- Roster copy on new season sheets will now only copy the content instead of content and formatting.


[1]: https://developers.google.com/apps-script/guides/triggers/installable#restrictions