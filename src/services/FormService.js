/*******************************************************************************
*                                                                              *
*   @license Copyright 2017 random-parts. All Rights Reserved.                 *
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
 * @overview Mananges the Team RSVP Form processes
 * @license Apache License, Version 2.0
 * @property {formService.PublicInterface} - available public methods
 */

/**
 * ** Form Services Object **
 *
 * @namespace formService
 * @property {formService.PublicInterface} - available public methods
 */
function formService () {
  var ss = Config.spreadsheet();
  var ss_id = ss.getId();
   
  /**
   * ---
   * Creates the team form and ties it to the current spreadsheet. 
   * Also moves the newly created Sheet to the last index position and hides it.
   * 
   * @memberof! formService#
   * @this form
   */
  function createForm () {
    this.name = team(ss).name;
    this.team_form = FormApp.create(this.name);
    this.destination_type = FormApp.DestinationType.SPREADSHEET;
    this.destination = ss_id;
    this.create();
    
    // Make all previous actions happen before moving on 
    SpreadsheetApp.flush();
    
    // Move the new form response sheet to the last index and hide it away
    var formsheet = ss.getSheets()[0];
    ss.setActiveSheet(formsheet);
    ss.moveActiveSheet(ss.getSheets().length);
    formsheet.hideSheet();
  }
  
  /**
   * ---
   * Detaches the form from the sheet and removes the response sheet 
   * from the spreadsheet. The form file is still in the Google Drive directory 
   * and will have to be deleted manually. This is to avoid extra permissions 
   * in the already extensive list this script ask for.
   * 
   * @memberof! formService#
   * @this form
   */  
  function removeForm () {
    this.team_form = Config.team_form();
    // Detach the sheets active form and delete the formsheet before creation
    if (this.team_form != null) {
       
      var all_sheets = ss.getSheets();
      all_sheets[1].getRange("F50").setValue(typeof Config.team_form())
      // Detach form
      this.team_form.removeDestination();
       // Delete form response sheet
      all_sheets.forEach(function (e, i) {
        if (RegExp(/Form\sResponses/i).test(e.getName())) { ss.deleteSheet(e) }
      });
    }
  }
  
  /**
   * ---
   * Make the form submission confirmation message less boring by 
   * setting a new quote there each day.
   *
   * |[quote list]{@link utils#fetchQuoteOfTheDay} | value kind
   * |---|---
   * | `q[0]` | author
   * | `q[1]` | quote
   * | `q[2]` | source
   * 
   * @memberof! formService#
   * @this form
   */
  function updateMessage () {
    var q = utils(ss).form.fetchQuote();
    var confirm = 'Your reply has been recorded.\n'
    confirm += '------------------------------------------------\n\n';
    
    this.team_form = Config.team_form();
    this.confirmation = confirm + q.quote + '\n\n- ' + q.author + q.source;
    this.updateMessage();
  }
  
  /**
   * ---
   * Updates the form title, as long as a form exist
   * 
   * @memberof! formService#
   * @this form
   * @param {String} title - form title
   */
  function updateTitle (title) {
    try {
      this.team_form = Config.team_form();
      this.title = title;
    } catch (e) {}
  }
  
  /**
   * ---
   * Process the form submission by setting the response into the correct cell
   * using the game column and the squad mates row position.
   *
   * | eventObject.values[] | value kind
   * |---|---
   * | `e.values[0]` | timestamp
   * | `e.values[1]` | rsvp
   * | `e.values[2]` | prefilled game Date/Time
   * | `e.values[3]` | prefilled email
   *
   * @memberof! formService#
   * @this squad
   * @param {EventObject} e - event object from [onFormSubmit()]{@link onFormSubmit}
   */
  function handleFormResponse (e) {
    var sh = ss.getSheets()[0];
    var col = (e.values[2] === "returning")
                ? ss.getRangeByName("nextSeasonRows").getColumn()
                : schedule(ss).gameColumn(e.values[2]);

    this.email = e.values[3];
    sh.getRange(this.getSquadRow(), col).setValue(e.values[1]);

    SpreadsheetApp.flush();
  }
  
  /**
   * @typedef {formService} formService.PublicInterface
   * @property {Function} createForm - [formService().createForm()]{@link formService#createForm}
   * @property {Function} handleFormResponse - [formService().handleResponse()]{@link formService#handleFormResponse}
   * @property {Function} removeForm - [formService().removeForm()]{@link formService#removeForm}
   * @property {Function} updateMessage - [formService().updateConfirmation()]{@link formService#updateMessage}
   * @property {Function} updateTitle - [formService().updateTitle()]{@link formService#updateTitle}
   */
  return {
    createForm: createForm.bind(form()),
    handleResponse: handleFormResponse.bind(squad(ss)),
    removeForm: removeForm.bind(form()),
    updateConfirmation: updateMessage.bind(form()),
    updateTitle: updateTitle.bind(form())
  }
}