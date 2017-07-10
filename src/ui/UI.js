/*******************************************************************************
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
*******************************************************************************/

/**
 * @overview Provides a User Interface to script processes and actions.
 * @license Apache License, Version 2.0
 * @property {ui.PublicInterface} - available public methods
 */

/**
 * ** UI Object **
 *
 * @namespace ui
 * @property {ui.PublicInterface} - available public methods
 */
function ui () {
  var ui = SpreadsheetApp.getUi();
  const alert_msg = { 
    clearall: "This Action will clear ALL values from the Displayed Schedule "
            + "and ALL RSVP's.\n\nDo you still want to continue?", 
    sendmail: "This Action will immediately send all emails required for the "
            + "next gameday,\nregardless of the current on-days-to-send email "
            + "setting.\n\nDo you still want to continue?",
    teamname: "Is the team name: "
  };
  
/*******************************************************************************
*                                  ui().alert                                  *
*******************************************************************************/

  /**
   * ---
   * Alert the user that the set-up task have finished.
   * 
   * @memberof! ui#
   */
  function informSetupComplete () {
    ui.alert("Set-up complete!");
  } 
  
/*******************************************************************************
*                                  ui().confirm                                *
*******************************************************************************/
  
  /**
   * ---
   * Alert the user to confirm the desired action of clearing all 
   * displayed schedules and rsvp values.
   * 
   * @memberof! ui# 
   * @return {Boolean|Null}
   */
  function isOkToClearValues () {
    var alert = ui.alert(alert_msg.clearall, ui.ButtonSet.YES_NO);
    
    if (alert == ui.Button.YES) { return true }
     else if (alert == ui.Button.NO) { return false }
     else if (alert == ui.Button.CLOSE) { ui.alert("Action was cancelled") }
    
    return null;
  }

  /**
   * ---
   * Alert the user to confirm immediate sending of all outstanding rsvp/cancel 
   * game notice emails for the upcoming gameday.
   * 
   * @memberof! ui# 
   * @return {Boolean|Null}
   */
  function sendEmail () {
    var alert = ui.alert(alert_msg.sendmail, ui.ButtonSet.YES_NO);
    
    if (alert == ui.Button.YES) { return true }
     else if (alert == ui.Button.NO) { return false }
     else if (alert == ui.Button.CLOSE) { ui.alert("Action was Cancelled") }
    
    return null;
  }

  /**
   * ---
   * Alert the user to confirm or deny the found team name 
   * for a new season sheet and/or weblink update.
   * 
   * @memberof! ui# 
   * @param {String} team - the team name to promt the user to confirm or deny
   * @return {Boolean|Null}
   */
  function isTeamName (team) {
    var alert = ui.alert(alert_msg.teamname + team, ui.ButtonSet.YES_NO);
 
    if (alert == ui.Button.YES) { return true }
     else if (alert == ui.Button.NO) { return false }
     else if (alert == ui.Button.CLOSE) { ui.alert("Name was not confirmed!") }
    
    return null;
  }
/*******************************************************************************
*                                  ui().menu                                   *
*******************************************************************************/  
  
  /**
   * ---
   * Create a custom menu with the options: 
   * - [Start a new season]{@link onNewSeason}
   * - [Run Schedule Update]{@link onRunSchedule}
   * - [Run Send Email Task]{@link onRunEmail}
   * - [Extra Options Help]{@link onOptionsHelp}
   * - [Re-install Team Form]{@link onResetForm}
   * - [Re-install Triggers]{@link onUpdateTriggers}
   * - [Re-set Web Link]{@link onWeblinkUpdate}
   * - [Remove Conditional Formatting]{@link onRemoveCondFormatting}
   * - [Remove Dependencies]{@link onRemoveDependencies}
   * - [Remove Triggers]{@link onRemoveTriggers}
   * - [Restore Conditional Formatting]{@link onUpdateCondFormatting}
   * - [Restore Data Validation]{@link onUpdateDataValidation}
   * - [Restore Named Ranges]{@link onUpdateNamedRange}
   * 
   * @memberof! ui#
   * @param {Event} e - event object from [onOpen()]{@link onOpen}
   */
  function addonMenu (e) {
    var menu = ui.createAddonMenu();
     
    if (e && e.authMode != ScriptApp.AuthMode.NONE) {
      menu.addItem("Start New Season", "onNewSeason")
          .addSeparator()
          .addSubMenu(ui.createMenu("Advanced Options")
                        .addItem("Run Schedule Update", "onRunSchedule")
                        .addItem("Run Send Email Task", "onRunEmail")
                        .addSeparator()
                        .addSubMenu(ui.createMenu("Extra Options")
                        .addItem("** Extra Options Help **", "onOptionsHelp")
                        .addItem("Re-install Team Form", "onResetForm")
                        .addItem("Re-install Triggers", "onUpdateTriggers")
                        .addSeparator()
                        .addItem("Re-set Web Link", "onWeblinkUpdate")
                        .addSeparator()
                        .addItem("Remove Conditional Formatting", "onRemoveCondFormatting")
                        .addItem("Remove Dependencies [soft un-install]", "onRemoveDependencies")
                        .addItem("Remove Triggers", "onRemoveTriggers")
                        .addSeparator()
                        .addItem("Restore Conditional Formatting", "onUpdateCondFormatting")
                        .addItem("Restore Data Validation", "onUpdateDataValidation")
                        .addItem("Restore Named Ranges", "onUpdateNamedRange")))
          .addToUi();
     }
  }
  
/*******************************************************************************
*                                  ui().modal                                  *
*******************************************************************************/

  /**
   * ---
   * Pop-up Modal help page for the Add-on Menu's Extra Options 
   * to help explain what the options are and what/when they should be used for.
   * 
   * @memberof! ui# 
   */
  function informExtraOptionsHelp () {
    var htmlOutput = HtmlService.createHtmlOutputFromFile("modal_options_help")
                                .setWidth(300)
                                .setHeight(440);
    ui.showModalDialog(htmlOutput, "Extra Options Help");
  }
  
/*******************************************************************************
*                                  ui().prompt                                 *
*******************************************************************************/  
  
  /**
   * ---
   * Prompt the user to enter a name for a new season sheet.
   * 
   * @memberof! ui# 
   * @return {String|Null}
   */
  function askSheetName () {
    var prompt_sheetname = ui.prompt("Enter a name for the sheet:", 
                                     ui.ButtonSet.OK_CANCEL);
    var button = prompt_sheetname.getSelectedButton();
    var text = (prompt_sheetname.getResponseText() == "") 
          ? null : prompt_sheetname.getResponseText();

    if (button == ui.Button.OK) { return text }
     else if (button == ui.Button.CANCEL) { return Utilities.getUuid() }
     else if (button == ui.Button.CLOSE) { ui.alert("No value was entered!") }
    
    return Utilities.getUuid();
  }

  /**
   * ---
   * Prompt the user to enter the URL where the sheet will get 
   * the current team schedule. 
   * Currently optimiszed for ezleagues.ezfacility.com team schedules.
   * 
   * @memberof! ui# 
   * @return {String} weblink
   */
  function askWeblink () {
    var prompt_weblink = ui.prompt("Enter the team schedule link:",
                                   ui.ButtonSet.OK);
    var button = prompt_weblink.getSelectedButton();
    var text = prompt_weblink.getResponseText();

    if (button == ui.Button.OK) { if (text != "") { return text } }
     else if (button == ui.Button.CLOSE) { ui.alert("No value was entered!") }
  }

  /**
   * @typedef {ui} ui.PublicInterface
   * @property {Function} informSetupComplete - [ui().alert.done()]{@link ui#informSetupComplete}
   * @property {Function} isOkToClearValues - [ui().confirm.clearall()]{@link ui#isOkToClearValues}
   * @property {Function} sendEmail - [ui().confirm.sendmail()]{@link ui#sendEmail}
   * @property {Function} isTeamName - [ui().confirm.teamname()]{@link ui#isTeamName}
   * @property {Function} addonMenu - [ui().menu()]{@link ui#addonMenu}
   * @property {Function} informExtraOptionsHelp - [ui().modal.optionsHelp()]{@link ui#informExtraOptionsHelp}
   * @property {Function} askSheetName - [ui().prompt.sheetname()]{@link ui#askSheetName}
   * @property {Function} askWeblink - [ui().prompt.weblink()]{@link ui#askWeblink}
   */
  return {
    alert: {
      done: informSetupComplete
    },
    confirm: {
      clearall: isOkToClearValues,
      sendemail: sendEmail,
      teamname: isTeamName
    },
    menu: addonMenu,
    modal: {
      optionsHelp: informExtraOptionsHelp
    },
    prompt: { 
      sheetname: askSheetName,
      weblink: askWeblink
    }
  }
}