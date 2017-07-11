# Team-Sports-RSVP
Google Sheets add-on for ezleagues.ezfacility.com team schedules

Google Sheets add-on link:

https://chrome.google.com/webstore/detail/team-sports-rsvp/ijpfbndfefefamogmomfgllnomhcgghm

---
### Getting Started

**Install options:**

- Use the link above to install the add-on from the chrome webstore
- Use [node-google-apps-script](https://www.npmjs.com/package/node-google-apps-script) to add the script to google drive
- Copy & paste the script into a new Google Apps Script file

**Set-up a new season sheet:**

- Navagate to the Add-on menu and find the `Team Sports RSVP` option. 
- Select the `Start New Season` option to activate sheet set-up. 
- Enter a name for the new sheet when prompted.
- Enter the web link to your Teams current schedule page from a ezleagues.ezfacility.com league; once prompted
- A completion alert will let you know when set-up is finished.
- Fill in the roster list with names and email addresses.
- At the start of the new season, run the menu option again and a new season sheet will be set up. Any roster members that replied positively to the playing `Next?` season column will be transfered to the new sheet. 

**Manual task running (Advanced Options):**

- The sheet schedule should auto-update as the website updates. It is possiable to run updates using the `Advanced Options>Run schedule update` option.
- 3 days and 1 day before the next gameday, the email task will process who has not yet rsvp'd to the game and will send an automated email reminder with the option to set their intention from within that email. If you feel a need to send the emails more often, the `Advanced Options>Run Send Email Task` is available to run the process immediately.


