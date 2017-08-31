# Team-Sports-RSVP
Google Sheets add-on for ezleagues.ezfacility.com team schedules

Google Sheets add-on link:

https://chrome.google.com/webstore/detail/team-sports-rsvp/ijpfbndfefefamogmomfgllnomhcgghm

---
### Getting Started

**Install options (pick one):**

- Use the link above to install the add-on from the chrome webstore
- Use [node-google-apps-script](https://www.npmjs.com/package/node-google-apps-script) to add the script to google drive
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
- 3 days and 1 day before the next gameday, the email task will process who has not yet rsvp'd to the game and will send an automated email reminder with the option to set their intention from within that email. If you feel a need to send the emails more often, the `Advanced Options>Run Send Email Task` is available to run the process immediately.

**Google Sheets share permissions**

- Share the sheet using the **"Anyone with the link can edit"** permission for optimal user experience. The script's Sheet protections allow for editing within certain ranges with data validation. This allows team members to update their status without having to first login to Google or to have a Google account, while still protecting the integrity of the sheet.

---
### Change Log

v1.2.12

- Displays the Venue/Field name
- Past game columns [rsvp columns & opponent cell] are now grayed out

Fixes

- Roster copy on new season sheets with now only copy the content instead of content and formatting.


[1]: https://developers.google.com/apps-script/guides/triggers/installable#restrictions