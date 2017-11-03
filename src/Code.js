/** ****************************************************************************
*   @license                                                                   *
*   Copyright 2017 random-parts. All Rights Reserved.                          *
*                                                                              *
*   Licensed under the Apache License, Version 2.0 (the "License");            *
*   you may not use this file except in compliance with the License.           *
*   You may obtain a copy of the License at                                    *
*                                                                              *
*       http://www.apache.org/licenses/LICENSE-2.0                             *
*                                                                              *
*   Unless required by applicable law or agreed to in writing, software        *
*   distributed under the License is distributed on an "AS IS" BASIS,          *
*   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   *
*   See the License for the specific language governing permissions and        *
*   limitations under the License.                                             *
***************************************************************************** */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
*       _____               ___               _      ___  _____   _____        *
*      |_   _|__ __ _ _ __ / __|_ __  ___ _ _| |_ __| _ \/ __\ \ / / _ \       *
*        | |/ -_) _` | '  \\__ \ '_ \/ _ \ '_|  _(_-<   /\__ \\ V /|  _/       *
*        |_|\___\__,_|_|_|_|___/ .__/\___/_|  \__/__/_|_\|___/ \_/ |_|         *
*                              |_|                                             *
*                                                                              *
*        Team Sports RSVP - Team schedule management spreadsheet add-on        *
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */ 

/**
 * @file Contains the controller methods used to orchestrate script actions
 * @license Apache License, Version 2.0
 * @version 1.3.17
 */

/**
 * ---
 * Script Configuration Object for debugging. Sets the proper Spreadsheeet Object 
 * depending on if the script is run as an add-on[!debug] 
 * or from the script-editor[debug] 
 *
 * @namespace Config
 * @property {Boolean} debug
 * @property {String} debug_ss_id - spreadsheet id for testing
 * @property {Spreadsheet} spreadsheet - `debug:` SpreadsheetByID() <br>
 * `!debug:` ActiveSpreadsheet()
 * @property {Form} team_form - `debug:` openByUrl() <br> `!debug:` getActiveForm()
 */  
var Config = {
  version: "1.3.17",
  debug: false,
  debug_ss_id: "SHEET_ID",
  spreadsheet: function () {
    if (this.debug) { return SpreadsheetApp.openById(this.debug_ss_id) }
     else { return SpreadsheetApp.getActiveSpreadsheet() }
  },
  storage: function () {
    if (this.debug) { return PropertiesService.getScriptProperties() }
     else { return PropertiesService.getDocumentProperties() }
  },
  team_form: function () {
      var form_url = this.spreadsheet().getFormUrl();
      return (form_url != null) ? FormApp.openByUrl(form_url) : null;
  }
}

/**
 * ---
 * onInstall() event that runs once. Runs the first time the add-on is installed.
 * It sets-up the triggers then runs onOpen to build the menu.
 *
 * @param {EventObject} e
 */
function onInstall (e) {  
  // Install the script project triggers
  onUpdateTriggers();

  // Run to get the Add-on Menu
  onOpen(e);
}

/**
 * ---
 * onOpen() event runs the start-up processes, i.e add-on menu build,
 * when the speadsheet is opened.
 * 
 * @param {EventObject} e
 */ 
function onOpen (e) {
  var ss = Config.spreadsheet();

  // Check that the script is up-to-date
  utils(ss).script.update();

  // Build the Add-On Menu
  ui().menu(e);
  SpreadsheetApp.flush();

  ss.setActiveSheet(ss.getSheets()[0]);
}

/**
 * ---
 * Auto runs the daily tasks. Set to update the schedule and then 
 * process any emails that should go out for the day.
 */   
function onDailyTrigger () {
  var ss = Config.spreadsheet();

  // Check that the script is up-to-date
  utils(ss).script.update();

  // Create a team form if one is not attached
  if (ss.getFormUrl() == null) { onCreateForm() }

  // Update the form confirmation message
  formService().updateConfirmation();

  // Update the displayed schedule
  scheduleService().update();

  // Run email task
  emailService().sendMail("today");

  SpreadsheetApp.flush();

  // Send daily email log
  emailService().sendMail("log");

  // Clear the email log
  storage().clear("email");
}

/**
 * ---
 * Form submit event triggers the app to update the displayed season schedule 
 * 
 * @param {EventObject} e
 */
function onFormSubmit (e) {
  formService().handleResponse(e);
} 

/**
 * ---
 * Sheet edit event within the web schedule range triggers an update to 
 * the displayed schedule when it pull changes in the schedule from the website
 *
 * @requires Installed onEdit() Trigger
 * @param {EventObject} e
 */
function onSheetEdit (e) {
  var ss = e.source;
  var range = e.range;
  var change_cell_row = e.range.rowStart;
  var change_cell_col = e.range.columnStart;
  var data_range = ss.getRangeByName("webSchedule");

  // Check if the edits are with the web data/schedule values
  if ((data_range.getRow() <= change_cell_row == change_cell_row <= data_range.getLastRow()) &&
      (data_range.getColumn() <= change_cell_col == change_cell_col <= data_range.getLastColumn())) {
    // Run the schedule update 
    scheduleService().update();
  }
}

/**
 * ---
 * Creates the sheet(s) needed to run a new season. Can be run from the 
 * Add-on Menu.
 *
 */
function onNewSeason () {
  var ss = Config.spreadsheet();
  // Check that the script is up-to-date
  utils(ss).script.update();

  var sheet_name = ui().prompt.sheetname;
  var ss_triggers = ScriptApp.getUserTriggers(ss);
  var active_sheet;
   // Install add-on triggers for this spreadsheet
   if (ss_triggers.length == 0) { onUpdateTriggers() }
   // Create a template sheet if one does not exist
   if (template(ss).getTemplate() == null) { sheetService().create.template() }

  // Create a season sheet
  sheetService().create.season(sheet_name);
  // Give it time to do what it needs to do
  Utilities.sleep(250);
  
  // Set the new sheet as the ActiveSheet
  active_sheet = ss.getSheets()[0];
  active_sheet.showSheet();
  ss.setActiveSheet(active_sheet);

  SpreadsheetApp.flush(); 
  Utilities.sleep(250);
  
  // Copy the returning squad mates to the new season sheet
  teamService().squad.setReturning();
  
  SpreadsheetApp.flush(); 
  Utilities.sleep(250);
  
  // Set the new web/online schedule link & team name
  onWeblinkUpdate();

  // Create a team form if one is not attached
  if (ss.getFormUrl() == null) { onCreateForm() } 

  // Set the sheet edit protection & data validation
  sheetService().update.protection();
  sheetService().update.validation();
  
  // Let the user know the set-up is finished
  ui().alert.done();
}

/*******************************************************************************
*                       Menu Options - Advanced Features                       *
*******************************************************************************/

/**
 * --- Menu Option: "Extra Options Help" */  
function onOptionsHelp () { ui().modal.optionsHelp() }

/**
 * --- Menu Option: "Re-install Triggers" */  
function onUpdateTriggers () { utils().script.install.triggers() }

/**
 * --- Menu Option: "Remove Triggers" */
function onRemoveTriggers () { utils().script.clean.triggers() }

/**
 * --- Menu Option: "Remove Conditional Formatting" */
function onRemoveCondFormatting () { sheetService().clear.conditionalFormatting() }

/**
 * --- Menu Option: "Remove Dependencies [soft un-install]" */
function onRemoveDependencies () { 
  utils().script.clean.triggers();
  settings().clearAll();
  formService().removeForm();
  
  SpreadsheetApp.flush(); 
  Utilities.sleep(500);
  
  sheetService().remove.sheet(settings().sheet.template_name);
}

/**
 * --- Menu Option: "Restore Data Validation" */ 
function onUpdateDataValidation () { sheetService().update.validation() }

/**
 * --- Menu Option: "Restore NamedRanges" */
function onUpdateNamedRange () { sheetService().update.namedRanges() }

/**
 * --- Menu Option: "Restore Conditional Formatting" */
function onUpdateCondFormatting () { sheetService().update.conditionalFormatting() }

/**
 * ---
 * Add-on Menu option to manually run the schedule update.
 */
function onRunSchedule () {
  scheduleService().update();
}

/**
 * ---
 * Add-on Menu option to manually send debt emails
 */
function onRunDebtEmail () {
  var ss = Config.spreadsheet();
  var isEmpty = ss.getRangeByName("squadEmail").isBlank();

  if (!isEmpty) {
     emailService().sendMail("other", "debt");
  }
}

/**
 * ---
 * Add-on Menu option to manually send emails for the next gameday
 */
function onRunNextEmail () {
  var ss = Config.spreadsheet();
  var isEmpty = ss.getRangeByName("squadEmail").isBlank();

  if (!isEmpty && ui().confirm.sendemail() == true) {
     emailService().sendMail("next");
  }
}

/**
 * ---
 * Add-on Menu option to manually send `returning next season` emails
 */
function onRunReturningEmail () {
  var ss = Config.spreadsheet();
  var isEmpty = ss.getRangeByName("squadEmail").isBlank();

  if (!isEmpty) {
     emailService().sendMail("other", "returning");
  }
}

/**
 * ---
 * Prompts the user to enter the link for the online schedule,
 * sets it in the sheet, and sets the team name in the spreadsheet and 
 * within the sheet's attached Form from the resulting schedule.
 *
 */
function onWeblinkUpdate () {
  var name_prompt = ui().confirm.teamname;
  var isConfirmed = ui().confirm.clearall;
  
  // Prompt to clear schedule range if it is not blank
  if (!scheduleService().isScheduleBlank()) {
    if (!isConfirmed()) { return }
    
    sheetService().clear.scheduleRanges();
    // Reset data validation and protections
    sheetService().update.protection();
    sheetService().update.validation();
  }
  
  // Prompt and set the web link
  scheduleService().setWebLink(ui().prompt.weblink());
  teamService().updateName(name_prompt);
  
  SpreadsheetApp.flush(); 
  Utilities.sleep(500);
  
  // Update the form title to match the team name
  formService().updateTitle(team().name);

  // Update displayed schedule
  onRunSchedule();  
}

/**
 * ---
 * Detaches the active form from the spreadsheet before 
 * creating a new form and attaching it.
 */
function onResetForm () {
  // Detach the attached form and clear the response sheet
  formService().removeForm();
  
  SpreadsheetApp.flush(); 
  Utilities.sleep(500);
  // Create Team Form
  onCreateForm();
}

/**
 * ---
 * Creating a new form and attaches it to the spreadsheet
 */
 function onCreateForm () {
  // Create Team Form
  formService().createForm();
   
  SpreadsheetApp.flush(); 
  Utilities.sleep(500);
  // Update the form confirmation message
  formService().updateConfirmation();
}