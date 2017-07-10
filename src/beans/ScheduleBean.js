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
 * @overview Gets and serves schedule data.
 * @license Apache License, Version 2.0
 * @property {schedule.PublicInterface} - available public methods
 */

/**
 * ** Schedule Bean Object **
 *
 * @namespace schedule
 * @property {schedule.PublicInterface} - available public methods
 * @param {Spreadsheet} spreadsheet - a spreadsheet object
 */
function schedule (spreadsheet) {
  var spreadsheet;
  var ss = spreadsheet || Config.spreadsheet();
  var ss_id = ss.getId();
  var composite, link, raw, values_range;
  
  /**
   * ---
   * Returns the Display Values of the composite/formated schedule that 
   * has been set to the sheet. Uses the Sheets API to retrieve 
   * displayed values by column as it auto trims empty values from range.
   *
   * | displaied schedule | value kind
   * |---|---
   * | `composite[i][0]` | Game n
   * | `composite[i][1]` | Date [ 'dddd\n" "mmm" "dd' ]
   * | `composite[i][2]` | [ time | score | "Cancelled" ]
   * | `composite[i][3]` | opponent [ **bold** => Home team ]
   * 
   * @memberof! schedule#
   * @return {Array} the displayed schedule information
   */
  function getComposite () {
    var values_range = ss.getRangeByName("gameRange");
    if (arguments.length) {
      var sh = ss.getSheets()[0];
      var values_range = sh.getRange(values_range.getRow(), 
                                     arguments[0], 
                                     values_range.getNumRows(), 
                                     arguments.length);
    }
    this.data_range = values_range.getA1Notation();
    this.options.dimension = "COLUMNS";
    
    return this.getRangeValues();
  }

  /**
   * ---
   * Return the raw schedule from the current/active sheet's
   * custom function [ =IMPORTHTML(cell, table, table_num) ] 
   * using the Sheets API
   *
   * | web schedule | value kind
   * |---|---
   * | `schedule[i][0]` | date [ EEE-MMM d ]
   * | `schedule[i][1]` | home team
   * | `schedule[i][2]` | [ "v" | score ]
   * | `schedule[i][3]` | away team
   * | `schedule[i][4]` | [ time | "Complete" | "Being Rescheduled" | "Pending Results" ]
   * | `schedule[i][5]` | "Being Rescheduled"
   * 
   * @memberof! schedule# 
   * @this apiBuilder
   * @return {Array} - schedule[][]
   */  
  function getRaw () {
    this.data_range = ss.getRangeByName("webSchedule").getA1Notation();
    
    return this.getRangeValues();
  }
  
  /**
   * ---
   * Get the DateTime value from the sheet cell using built-in range methods 
   * instead of the Sheets API to avoid datetime conversion hoop-jumping
   * 
   * @memberof! schedule#
   * @return {Array} Game DateTime values
   */
  function getCompositeDateValues () {
    var dates = ss.getRangeByName("dateColumns").getValues(); 
    return dates[0].filter(String);
  }
  
  /**
   * ---
   * Retreives the rsvp values by column(s) using the Sheets API
   *
   * | array | value kind
   * |---|---
   * | `rsvp[i][row]` | squad mate's row
   * 
   * @memberof! schedule#
   * @param {Array} optional - array of colums for the range setting
   * @return {Array} rsvp values by column
   */
  function rsvpValues () {
    var values_range = ss.getRangeByName("rsvpRange");
    if (arguments.length) {
      var sh = ss.getSheets()[0];
      var values_range = sh.getRange(values_range.getRow(), 
                                     arguments[0], 
                                     values_range.getNumRows(),
                                     arguments.length);
    }
    this.data_range = values_range.getA1Notation();
    this.options.dimension = "COLUMNS";
    
    return this.getRangeValues();
  }
  
  /**
   * ---
   * Finds and returns the column number of a game by date
   * 
   * @memberof! schedule#
   * @param {Date} game_date - date object
   * @return {Number} - column position
   */
  function getGameColumn (game_date) {
    var composite_dates = getCompositeDateValues();
    var current_column = ss.getRangeByName("dateColumns").getColumn();
    
    // Map the date objects to strings for indexOf()
    current_column += composite_dates.map(function (e) { return e.toString() })
                                     .indexOf(game_date.toString());
    return current_column;
  }

  /**
   * @typedef {schedule} schedule.PublicInterface
   * @property {Function} getComposite - [schedule().composite()]{@link schedule#getComposite}
   * @property {Function} getCompositeDateValues - [schedule().compositeDates()]{@link schedule#getCompositeDateValues}
   * @property {Function} getGameColumn - [schedule().gameColumn()]{@link schedule#getGameColumn}
   * @property {Function} getRaw - [schedule().raw()]{@link schedule#getRaw}
   * @property {Function} rsvpValues - [schedule().rsvp()]{@link schedule#rsvpValues}
   */
  return {
    composite: getComposite.bind(apiBuilder(ss, ss_id)),
    compositeDates: getCompositeDateValues,
    gameColumn: getGameColumn,
    raw: getRaw.bind(apiBuilder(ss, ss_id)),
    rsvp: rsvpValues.bind(apiBuilder(ss, ss_id))
  }
}