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
 * @overview Handles sheet & template creation. Also, properties such as 
 * sheet protection, data validation and conditional formatting.
 * @license Apache License, Version 2.0
 * @property {sheetService.PublicInterface} - available public methods
 */

/**
 * ** Sheet Service Object **
 * 
 * @namespace sheetService
 * @property {sheetService.PublicInterface} - available public methods
 */
function sheetService () {
  var ss = Config.spreadsheet();
  var ss_id = ss.getId();

/*******************************************************************************
*                            sheetService().clear                              *
*******************************************************************************/
  
  /**
   * ---
   * Removes all conditional formatting for the sheet provided.
   *
   * @memberof! sheetService#
   */
  function removeConditionalFormatting () {
     var sh = ss.getSheets()[0]; 
     var sheet_id = sh.getSheetId();
     var i = (sh.getIndex() - 1);
    
     try {
       // Delete formatting until none exist
       do { 
         var req = {
           "deleteConditionalFormatRule": {
             "index": 0,
             "sheetId": sheet_id 
           }
         };  
         var request_body = {
           "requests": [req],
           "includeSpreadsheetInResponse": true
         };
    
         var payload = JSON.stringify(request_body);
         var response = Sheets.Spreadsheets.batchUpdate(payload, ss_id);
         // Use the response object to determine if there are more conditional formats
         var formatting = response.updatedSpreadsheet.sheets[i].conditionalFormats;

      } while (typeof formatting != "undefined");
    } 
    catch (e) {};
  }
  
  /**
   * ---
   * Resets the sheets schedule content, formats, data validate and sheet protection.
   *
   * @memberof! sheetService#
   */
  function resetGameAndRsvpRange () {
    var template_sheet = template(ss).getTemplate();
    var sh = ss.getSheets()[0];
     if (template_sheet == null) { templateSheet.bind(template(ss)) }
    var game_range = ss.getRangeByName("gameRange")
    var row = game_range.getRow();
    var col = game_range.getColumn();
    var last_row = ss.getRangeByName("rsvpRange").getLastRow();
    var last_col = game_range.getLastColumn();
    var sheet_range = sh.getRange(row, col, last_row, last_col);
    var template_range = template_sheet.getRange(row, col, last_row, last_col);
    
    // Copy the schedule & rsvp content+format from the template to the sheet
    template_range.copyTo(sheet_range);
    // Clear the weblink cell - which will also clear the web data
    ss.getRangeByName("webLink").clearContent();
  }
  
/*********************************************************************************
*                            sheetService().create                               *
*********************************************************************************/
  
  /**
   * ---
   * Creates a new formatted season sheet based on the template sheet.
   *
   * @memberof! sheetService#
   * @this sheet
   * @param {String} arguments[0] type "season"
   * @param {String} arguments[1] sheetname
   */
  function seasonSheet (prompt_name) {
    var template_sheet = template(ss).getTemplate()
    
    this.prefix = "";
    this.name = prompt_name(); 
    this.options = { template: template_sheet };
    this.index = 0;
    // Create new sheet
    this.create();
    
    this.sh = ss.getSheets()[0];
    
    this.updateNamedRanges();
    // Set the web import data link
    this.setFormulas();

    setSheetConditionalFormatting.call(sheet(ss), this.sh);

    SpreadsheetApp.flush();
  }
  
  /**
   * ---
   * Creates a template sheet for the creation of new season sheets
   *
   * @memberof! sheetService#
   * @this sheet
   * @param {String} arguments[0] "template"
   */
  function templateSheet () {
    var template_name = settings().sheet.template_name;

    this.template_name = template_name;
    this.index = ss.getSheets().length;
    this.prefix = settings().sheet.template_prefix;
     
    // Create the Template sheet
    this.create();

    this.template_sheet = ss.getSheetByName(template_name);

    this.updateNamedRanges();
    this.format();
    this.setValues();

    // Declutter the named range space
    this.removeNamedRanges();
    
    // Make sheet tabs list prettier
    this.getTemplate().hideSheet();
    
    SpreadsheetApp.flush();
  }

/*********************************************************************************
*                            sheetService().remove                               *
*********************************************************************************/
  
  /**
   * ---
   * Removes a sheet by name from the spreadsheet.
   *
   * @memberof! sheetService#
   * @this sheet
   * @param {String} name - name of sheet to remove
   */
  function removeSheet (name) {
    this.name = name;
    this.remove();
  }
  
/*********************************************************************************
*                            sheetService().update                               *
*********************************************************************************/ 

  /**
   * ---
   * Create sheet protection with unprotected ranges to allow for rsvp updates 
   * to the sheet from squad mates without forcing them to first login.
   *
   * @memberof! sheetService#
   * @this sheet
   */
  function setSheetProtections () {
    this.sheet_protection = ss.getSheets()[0].protect();
    this.unprotected_list = [ss.getRangeByName("rsvpRange"), ss.getRangeByName("nextSeasonRows")];
    this.editor = Session.getEffectiveUser();
    this.editor_list = this.sheet_protection.getEditors();
    
    this.setProtect();
  }
  
  /**
   * ---
   * Create data validation rules for ranges in the sheet. 
   *
   * @memberof! sheetService#
   * @this sheet
   */
  function setSheetValidation () {
    this.validation_ranges = [ss.getRangeByName("rsvpRange"), ss.getRangeByName("nextSeasonRows")]
    // Prevent bad input
    this.rule = SpreadsheetApp.newDataValidation()
                              .requireValueInList(form().rsvp_opts, false)
                              .setAllowInvalid(false)
                              .build();
    this.validation();
  }
  
  /**
   * ---
   * Sets all conditional formatting in one API BatchUpdate Request
   *
   * @memberof! sheetService#
   * @param {SheetObject} sheet - the sheet to work on
   */
  function setSheetConditionalFormatting (sheet) {
    var requests_list = [];

    this.sh = sheet || ss.getSheets()[0];
    // Gather the conditional formatting request
    requests_list.push(this.conditionalFormat.rsvp());
    requests_list.push(this.conditionalFormat.squad());
    // Create the BatchUpdate Request object
    var request_body = {
      "requests": requests_list,
      "includeSpreadsheetInResponse": false
    };

    Sheets.Spreadsheets.batchUpdate(JSON.stringify(request_body), ss_id);
  }

  /**
   * ---
   * Removes a sheet by name from the spreadsheet
   *
   * @memberof! sheetService#
   * @this sheet
   */  
  function updateNamedRanges() {
    this.sh = ss.getSheets()[0];
    this.prefix = "";
    this.named_ranges = ss.getNamedRanges()
    this.removeNamedRanges();
    this.updateNamedRanges();
  }

  /**
   * @typedef {sheetService} sheetService.PublicInterface
   * @property {Function} removeConditionalFormatting - [sheetService().clear.conditionalFormatting()]{@link sheetService#removeConditionalFormatting}
   * @property {Function} resetGameAndRsvpRange - [sheetService().clear.scheduleRanges()]{@link sheetService#resetGameAndRsvpRange}
   * @property {Function} createSheet - [sheetService().create.season()]{@link sheetService#createSheet}
   * @property {Function} templateSheet - [sheetService().create.template()]{@link sheetService#templateSheet}
   * @property {Function} removeSheet - [sheetService().remove.sheet()]{@link sheetService#removeSheet}
   * @property {Function} setSheetConditionalFormatting - [sheetService().update.conditionalFormatting()]{@link sheetService#setSheetConditionalFormatting}
   * @property {Function} updateNamedRanges - [sheetService().update.namedRanges()]{@link sheetService#updateNamedRanges}
   * @property {Function} setSheetProtections - [sheetService().update.protection()]{@link sheetService#setSheetProtections}
   * @property {Function} setSheetValidation - [sheetService().update.validation()]{@link sheetService#setSheetValidation}
   */
  return {
    clear: {
      conditionalFormatting: removeConditionalFormatting,
      scheduleRanges: resetGameAndRsvpRange
    },
    create: {
      season: seasonSheet.bind(sheet(ss)),
      template: templateSheet.bind(template(ss))
    },
    remove: {
      sheet: removeSheet.bind(sheet(ss))
    },
    update: {
      conditionalFormatting: setSheetConditionalFormatting.bind(sheet(ss)),
      namedRanges: updateNamedRanges.bind(sheet(ss)),
      protection: setSheetProtections.bind(sheet(ss)),
      validation: setSheetValidation.bind(sheet(ss))
    }
  }
}
