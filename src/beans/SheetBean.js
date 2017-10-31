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
 * @overview Gets and Sets formats and properties for new season sheets
 * @license Apache License, Version 2.0
 * @property {sheet.PublicInterface} - available public methods
 */

/**
 * ** Sheet Bean Object **
 *
 * @namespace sheet
 * @property {sheet.PublicInterface} - available public methods
 * @param {Spreadsheet} spreadsheet - a spreadsheet object
 */
function sheet (spreadsheet) {
  var spreadsheet;
  var ss = spreadsheet || Config.spreadsheet();
  var sh = sh || ss.getSheets()[0];
  var editor, editor_list, name, prefix, protection, index, options,
      rule, sheet_protection, unprotected_list, validation_ranges, named_ranges;

  /**
   * ---
   * Creates a new sheet with options
   *
   * @memberof! sheet#
   */
  function createSheet () {
    ss.insertSheet(name, index, options);
  }

  /**
   * ---
   * Sets the data validation rule to each range in the validation_ranges list.
   *
   * @memberof! sheet#
   */
  function dataValidation () {
    validation_ranges.forEach(function (e) { e.setDataValidation(rule) });
  }
  
  /**
   * ---
   * Removes a set of named ranged if defined, else clears all of them.
   *
   * @memberof! sheet#
   */
  function deleteNamedRanges () {
    if (typeof named_ranges != "undefined") {
      named_ranges.forEach(function (e) { e.remove() });
    } else {
       var named_ranges = ss.getNamedRanges();
       named_ranges.forEach(function (e) { e.remove() });
    }
  }  
  
  /**
   * ---
   * Removes a sheet fromt the spreadsheet by name.
   *
   * @memberof! sheet#
   */
  function deleteSheet () {
    var rm_sheet = ss.getSheetByName(name);
    if (rm_sheet != null) { ss.deleteSheet(rm_sheet) }
  }
  
  /**
   * ---
   * Sets the named ranges on a sheet.
   *
   * @memberof! sheet#
   */
  function setNamedRanges () {
    const namedranges = {
   // sheet format ranges
      teamName: "A1",
      teamBlock: "A1:A3",
      blankBlock: "B1:E3",
   // visible schedule ranges
      gameRange: "F1:Z4",
      headerColumns: "F1:Z1",
      dateColumns: "F2:Z2",
      timeColumns: "F3:Z3",
      oppColumns: "F4:Z4",
   // squad ranges
      squad: "A5:E20",
      squadEmail: "A5:B20",
      squadHeader: "A4:E4",
      nextSeasonRows: "C5:C20",
      paidRangeRows: "D5:D20",
      rsvpRange: "F5:Z20",
   // web schedule ranges
      webLink: "A100",
      webData: "B100",
      webSchedule: "B101:G121"
    };
   
    for (var key in namedranges) {
      ss.setNamedRange(prefix + key, sh.getRange(namedranges[key]));
    }
  }

  /**
   * ---
   * Set sheet protection and unprotects edit ranges.
   *
   * @memberof! sheet#
   */
  function setUnprotectedRanges () {
    sheet_protection.setUnprotectedRanges(unprotected_list);
    sheet_protection.setDescription("Team Sheet Protection");
    sheet_protection.addEditor(editor);
    sheet_protection.removeEditors(editor_list);
  }
 
  /**
   * ---
   * Adds the =IMPORTHTML() formula into the sheet. 
   * This retrieves the web table data used for 
   * the team's season schedule information.
   *
   * @memberof! sheet#
   * @default table_num - 11
   */
  function setFormulas () {
    var table_num = settings().sheet.import_table;
    var link_range = ss.getRangeByName("webLink");
    var data_range = ss.getRangeByName("webData");
    data_range.setFormula(
      '=IMPORTHTML(' + link_range.getA1Notation() + ', "table", ' + table_num + ')'
    ); 
  }
  
/******************************************************************************
*                          sheet().conditionalFormat                          *
******************************************************************************/

  /**
   * ---
   * Creates the conditional format request object for the RSVP Range.
   * Dim the font foreground color in columns
   * where the date in the game date cell is in the past.
   *
   * @memberof! sheet#
   * @return {Array} requests_list - Conditional format rule for each RSVP column
   */
  function getRSVPConditionalFormatting () {
    var sheet_id = sh.getSheetId();
    var rsvp_range = ss.getRangeByName("rsvpRange") || ss.getRangeByName("_t_rsvpRange");
    var date_range =  ss.getRangeByName("dateColumns") || ss.getRangeByName("_t_dateColumns");
    var requests_list = [];

    SpreadsheetApp.flush();

    // Add each columns' update request into an array for batch processing
    for (var i = 0; i < rsvp_range.getNumColumns(); i++) {
      var is_pastdate_cell = sh.getRange(date_range.getRow(), (i + rsvp_range.getColumn()));
      var absolute_range = is_pastdate_cell.getA1Notation().replace(/([A-Z]*)([0-9]*)/, "$$$1$$$2");

      // Set the range for the rule_condition
      var range = {
        "sheetId": sheet_id,
        "startRowIndex": rsvp_range.getRow() - 2,
        "endRowIndex": rsvp_range.getLastRow(),
        "startColumnIndex": i + rsvp_range.getColumn() - 1,
        "endColumnIndex": i + rsvp_range.getColumn(),
      };

      // Condition rule for the formatting
      var rule_condition = {
        "type": "CUSTOM_FORMULA",
        "values": [{"userEnteredValue": '=IF(' + absolute_range + '< TODAY(), True)'}]
      };

      // Full batchUpdate request object
      var req = {
        "addConditionalFormatRule": {
          "rule": {
            "ranges":[range],
            "booleanRule": {
              "condition": rule_condition,
              "format": {
                "textFormat": {
                  "foregroundColor": {
                    "red": 0.878,
                    "green":0.878,
                    "blue": 0.878,
                    "alpha": 1
                  }
                }
              }
            }
          },
          "index": 0
        }
      };

      requests_list.push(req);
    }

    return requests_list
  }

  /**
   * ---
   * Creates the conditional format request object for the Squad Range.
   * It changes the background color of the squad mates row depending
   * on if the first column of the row range is blank.
   *
   * @memberof! sheetService#
   * @return {Array} requests_list - Conditional format rule for each Squad row
   */
  function getSquadConditionalFormatting () {
    var sheet_id = sh.getSheetId();
    var squad_range = ss.getRangeByName("squad") || ss.getRangeByName("_t_squad");
    var requests_list = [];

    SpreadsheetApp.flush();

    // Add each rows' update request into an array for batch processing
    for (var i = 0; i < squad_range.getNumRows(); i++) {
      var isblank_cell = sh.getRange((i + squad_range.getRow()), squad_range.getColumn());
      var absolute_range = isblank_cell.getA1Notation().replace(/([A-Z]*)([0-9]*)/, "$$$1$$$2");

      // Set the range for the rule_condition
      var range = {
        "sheetId": sheet_id,
        "startRowIndex": i + (squad_range.getRow() - 1),
        "endRowIndex": i + squad_range.getRow(),
        "startColumnIndex": 0,
        "endColumnIndex": squad_range.getLastColumn()
      };

      // Condition rule for the formatting
      var rule_condition = {
        "type": "CUSTOM_FORMULA",
        "values": [{"userEnteredValue": '= ISBLANK(' + absolute_range + ')'}]
      };

      // Full batchUpdate request object
      var req = {
        "addConditionalFormatRule": {
          "rule": {
            "ranges":[range],
            "booleanRule": {
              "condition": rule_condition,
              "format": {
                "backgroundColor": {
                  "red": 0.741,
                  "green":0.741,
                  "blue": 0.741,
                  "alpha": 1
                }
              }
            }
          },
          "index": 0
        }
      };

      requests_list.push(req);
    }

    return requests_list
  }

  /**
   * @typedef {sheet} sheet.PublicInterface
   * @property {Function} createSheet - [sheet().create()]{@link sheet#createSheet}
   * @property {Function} deleteSheet - [sheet().remove()]{@link sheet#deleteSheet}
   * @property {Function} deleteNamedRanges - [sheet().removeNamedRanges()]{@link sheet#deleteNamedRanges}
   * @property {Function} setFormulas - [sheet().setFormulas()]{@link sheet#setFormulas}
   * @property {Function} setUnprotectedRanges - [sheet().setProtect()]{@link sheet#setUnprotectedRanges}
   * @property {Function} setNamedRanges - [sheet().updateNamedRanges()]{@link sheet#setNamedRanges}
   * @property {Function} dataValidation - [sheet().validation()]{@link sheet#dataValidation}
   * @property {Function} getRSVPConditionalFormatting - [sheet().conditionalFormat.rsvp()]{@link sheet#getRSVPConditionalFormatting}
   * @property {Function} getSquadConditionalFormatting - [sheet().conditionalFormat.squad()]{@link sheet#getSquadConditionalFormatting}
   * @property {SheetObject} sh - (Accessor|Mutator)
   * @property {String} editor - (Mutator) single editor
   * @property {Array} editor_list - (Mutator) editor list
   * @property {Number} index - (Mutator) sheet position
   * @property {String} name - (Mutator) a sheet name
   * @property {Array} named_ranges - (Mutator) list of named_ranges
   * @property {Struct} options - (Mutator) options object for sheet insertion
   * @property {String} prefix - (Mutator) named_range prefix
   * @property {DataValidation} rule - (Mutator) data validation rule 
   * @property {Protection} sheet_protection - (Mutator) protection object
   * @property {Array} unprotected_list - (Mutator) ranges to be left unprotected 
   * @property {Array} validation_ranges - (Mutator) ranges to set rules on
   */
  return {
    create: createSheet,
    remove: deleteSheet,
    removeNamedRanges: deleteNamedRanges,
    setFormulas: setFormulas,
    setProtect: setUnprotectedRanges,
    updateNamedRanges: setNamedRanges,
    validation: dataValidation,
    conditionalFormat: {
      rsvp: getRSVPConditionalFormatting,
      squad: getSquadConditionalFormatting
    },
    //
    get sh () { return sh },
    get sheet_protection () { return sheet_protection },
    set editor (val) { editor = val },
    set editor_list (val) { editor_list = val },
    set index (val) { index = val },
    set name (val) { name = val },
    set named_ranges (val) { named_ranges = val },
    set options (val) { options = val },
    set prefix (val) { prefix = val },
    set rule (val) { rule = val },
    set sh (val) { sh = val },
    set sheet_protection (val) { sheet_protection = val },
    set unprotected_list (val) { unprotected_list = val },
    set validation_ranges (val) { validation_ranges = val }
  }
}