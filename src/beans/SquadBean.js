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
 * @overview Handles squad information including contact details and rsvp status. 
 * Also, gets and serves the squad data from the spreadsheet
 *
 * @license Apache License, Version 2.0
 * @property {squad.PublicInterface} - available public methods
 */

/**
 * ** Squad Bean Object **
 *
 * @namespace squad
 * @property {squad.PublicInterface} - available public methods
 * @param {Spreadsheet} spreadsheet - a spreadsheet object
 */
function squad (spreadsheet) {
  var spreadsheet;
  var ss = spreadsheet || Config.spreadsheet();
  var ss_id = ss.getId();
  var sh = ss.getSheets()[0];
  var sheet_name = sh.getName();
  var name, email, returning, squad_row, values_range;

  /**
   * ---
   * Return all of the contact information for the named sheet.
   *
   * @memberof! squad# 
   * @this apiBuilder
   * @default first sheet - index [0]
   * @return {Array} - [[name,email,next_season,paid,phone]]
   */
  function fullSquad () {
    var values_range = (arguments[0] || sheet_name) + "!" + ss.getRangeByName("squad")
                                                              .getA1Notation();
    this.data_range = values_range;
    
    return this.getRangeValues();
  }
  
  /**
   * ---
   * Returns the squad rows in the `Next?` / returning column
   *
   * @memberof! squad#
   * @return {String[]}
   */
  function getReturningRows () {
    var rr = ss.getRangeByName("nextSeasonRows").getValues().join().split(",");

    // Apply pending Spreadsheet changes
    SpreadsheetApp.flush();

    return rr;
  }


  /**
   * ---
   * Returns the squad rows in the `paid` column
   *
   * @memberof! squad#
   * @return {String[]}
   */
  function paidRows () {
    var pr =  ss.getRangeByName("paidRangeRows").getValues().join().split(",");

    // Apply pending Spreadsheet changes
    SpreadsheetApp.flush();

    return pr;
  }

  /**
   * ---
   * Returns the names and emails of current squad mates
   * as an unfiltered and filtered list
   *
   * @memberof! squad#
   * @this apiBuilder()
   * @return {Array}
   * ```
   * [0][x][x] unfiltered
   * [1][x][x] filtered
   * [x][i][0] name
   * [x][i][1] email
   * ```
   */
  function squadEmails () {
    this.data_range = ss.getRangeByName("squadEmail").getA1Notation();
    var e = this.getRangeValues();

    return [e, e.filter(function (x) { return (typeof x[1] != "undefined") })];
  }

  /**
   * ---
   * Finds the squad mates row position by email.
   *
   * @memberof! squad#
   * @return {Number} row position
   */
  function getSquadRowByEmail () {
    var email_list = squadEmails.call(apiBuilder(ss, ss_id));
    var squad_row = email_list[0].map(function (e) {
                    if (typeof e[1] == "undefined") { return "" }
                    return e[1].toString();
                    }).indexOf(email) + ss.getRangeByName("squadEmail")
                                          .getRow();
    return squad_row;
  }
  
  /**
   * ---
   * Sets the returning squad list to the named sheet.
   * The playing `Next?` season column must contain a `y`.
   * "yes", "probably", "maybe", etc
   *
   * @memberof! squad#
   * @this apiBuilder
   */
  function setReturningSquadMates () {
    var squad_range = ss.getRangeByName("squad");
    var sheet = ss.getSheetByName(sheet_name);
    var values_range = sheet.getRange(squad_range.getRow(),
                                      squad_range.getColumn(),
                                      returning.length,
                                      squad_range.getNumColumns());

    this.value_range.range = values_range.getA1Notation();
    this.value_range.values = returning;
    this.update.options.valueInput = "USER_ENTERED";

    return this.updateRangeValues();
  }
  
  /**
   * @typedef {squad} squad.PublicInterface
   * @property {Function} squadEmails - [squad().emails()]{@link squad#squadEmails}
   * @property {Function} fullSquad - [squad().full()]{@link squad#fullSquad}
   * @property {Function} paidRows - [squad().gatPaidRows()]{@link squad#paidRows}
   * @property {Function} getReturningRows - [squad().getReturningRows()]{@link squad#getReturningRows}
   * @property {Function} getSquadRowByEmail - [squad().getSquadRow()]{@link squad#getSquadRowByEmail}
   * @property {Function} setReturningSquadMates - [squad().setReturningSquad()]{@link squad#setReturningSquadMates}
   * @property {String} sheet_name - (Accessor|Mutator)   * @property {String} name - (Mutator)
   * @property {String} email - (Mutator)
   * @property {Array} returning - (Mutator)
   * @property {Object} squad_row - (Mutator)
   * @property {Range} values_range - (Mutator)
   */
  return {
    emails: squadEmails.bind(apiBuilder(ss, ss_id)),
    full: fullSquad.bind(apiBuilder(ss, ss_id)),
    getPaidRows: paidRows,
    getReturningRows: getReturningRows,
    getSquadRow: getSquadRowByEmail,
    setReturningSquad: setReturningSquadMates.bind(apiBuilder(ss, ss_id)),
    //
    get sheet_name () { return sheet_name },
    set name (val) { name = val },
    set email (val) { email = val },
    set returning (val) { returning = val },
    set sheet_name (val) { sheet_name = val },
    set squad_row (val) { squad_row = val },
    set values_range (val) { values_range = val }
  }
}