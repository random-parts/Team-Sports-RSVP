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
 * @overview Mananges the season schedule processing
 * @license Apache License, Version 2.0
 * @property {scheduleService.PublicInterface} - available public methods
 */

/**
 * ** Schedule Service Object **
 *
 * @namespace scheduleService
 * @property {scheduleService.PublicInterface} - available public methods
 */
function scheduleService () {
  var ss = Config.spreadsheet();
  var ss_id = ss.getId();
  var tz = ss.getSpreadsheetTimeZone();
  var gamedate_range = ss.getRangeByName("dateColumns");

  /**
   * ---
   * Processes the raw web schedule data into the 
   * composite/displayed schedule used by the script. 
   * Checks for the status of games based on 
   * a few key words to determine how to handle it.
   * 
   * @memberof! scheduleService#
   * @this game
   */
  function updateSchedule () {
    var s = schedule().raw() || "";
      if (!s.length) { return } // Exit on empty web schedule
    
    var c = schedule(ss).composite() || "";
    var count = Math.max(s.length, c.length);
    var composite_dates = schedule(ss).compositeDates();
    var rsvp_values = schedule(ss).rsvp();
    var my_team = team().name;
    var column_offset = 0;
    var game_num_offset = 0;
    var gameday_values = [];

   // Map the rsvp replies with the game date of the same column
    try {
      composite_dates.forEach(function (e, i) {
        gameday_values.push([e, rsvp_values[i]]);
      });
    } catch (e) {
      rsvp_values = [];
    }

  /*  START UPDATE SCHEDULE LOOP
  *******************************************************************************/
   outerloop:
    for (var i = 0; i < count; i++) {
      this.column = (i + column_offset);
      var isBeingRescheduled = RegExp(/rescheduled/i).test(s[i]);
      /** 
       * @name isCancelled 
       * @function 
       * @inner
       * @param {Number} column - this.column
       * @return {Boolean}
       */
      var isCancelled = function (column) {
        return (typeof c[column] == "undefined") ? false : Boolean(c[column][2] == "Cancelled");
      }
      
      // Skip over the displayed column(s) with cancelled games
      while (isCancelled(this.column) == true && isBeingRescheduled == false) {
         column_offset += 1;
         this.column = (i + column_offset);
      }
      
      // Check if the cancelled game is the same game being rescheduled or a different game
      while (isCancelled(this.column) == true && isBeingRescheduled == true) {
        var a = Utilities.formatDate(new Date(composite_dates[this.column]), tz, "EEE MMM d");
        var b = s[i][0].replace(/-/, " ");
        if (a != b) {
           column_offset += 1;
           game_num_offset += 1;
           this.column = (i + column_offset);
         } else { // Dates match > advance the raw schedule index
           game_num_offset += 1;
           continue outerloop; 
         }
      }
      
      // Adjust game number for games just now being rescheduled
      if (isBeingRescheduled == true) { game_num_offset += 1; }

      // Raw schedule is done > remove any left over displayed columns & advance the count
      if (typeof s[i] == "undefined") { 
        this.clear(); 
        continue outerloop; 
      } 
      // Set the formatted game cells
      this.my_side = (s[i][1] == my_team) ? "home" : "away";
      this.header = (i + 1) - game_num_offset;
      this.home_team = s[i][1];
      this.score = s[i][2];
      this.away_team = s[i][3];
      this.status = s[i][4];  
      this.field = s[i][5];
      this.opponent();

      // Only set the date when status is a time or the date cell is empty
      if (RegExp(/^[0-9]+/).test(s[i][4]) == true) { 
        this.date = utils(ss).date.makeDateTime(s[i][0], s[i][4]);
      } else if (!this.date) {
        try { this.date = s[i][0].replace(/-/, " ") } 
         catch (e) {}
      }
    }
    
  /*  END UPDATE SCHEDULE LOOP - finish running updateSchedule 
  *******************************************************************************/

    // Reset the rsvp columns to adjust for changes/additions to the schedule if needed.
    // Only runs if there is an addition to to the displayed schedule.
    // May cause rsvp column position problems if games are set and then after some time 
    //   are removed without having been cancelled out.
    /** @todo Handle rsvp actions when games are deleted without being cancelled out */
    if (gameday_values.length && ((s.length + column_offset) > gameday_values.length)) {
      _resetRSVPColumns(gameday_values);
    }
    
    // Set the column highlight on the next gameday game columns
    this.column = getNextGameDayCols()[0][0][0];
    this.highlightGame();
  }

  /**
   * ---
   * Finds the next/upcoming gameday and places all games 
   * scheduled for that day into an array by the games column position
   *
   * | return array | value kind
   * |---|---
   * | `gameday_games[0][i]` | Array of gameday games column positions
   * | `gameday_games[1][i]` | Array of Date Object for gameday games
   *
   * 
   * @memberof! scheduleService#
   * @return {Array} column position and datetime of the next gameday games
   */
  function getNextGameDayCols () {
    var c_dates = schedule().compositeDates();
    var today = utils(ss).date.format("yearday");
    var game_dates = [];
    var game_columns = [];
    
    // Compares current column with next column for multiple games in one day
    for (var i = 0; i < c_dates.length; i++) {
      var current_date = utils(ss).date.format("yearday", new Date(c_dates[i]));

      if (typeof c_dates[i + 1] != "undefined") {
        var next_date = utils(ss).date.format("yearday", new Date(c_dates[i + 1]));

      } else { 
        var next_date = false; 
      }
  
      if (current_date >= today && c_dates[i] != "") {
        game_dates.push(c_dates[i]);
        game_columns.push(schedule(ss).gameColumn(c_dates[i]));
        // Exit if the next gameday was found and there are no more games on that day
        if (current_date != next_date) { break }
      }
    }
    
    return [game_columns, game_dates];
  }
  
  /**
   * ---
   * Checks if the composite schedule and rsvp ranges are both blank
   * 
   * @memberof! scheduleService#
   * @return {Boolean} true|false
   */
  function isScheduleRangeBlank () {
     return ss.getRangeByName("gameRange").isBlank() 
            && ss.getRangeByName("rsvpRange").isBlank();
  }
  
  /**
   * ---
   * Places the web schedule link into the season sheet
   * 
   * @memberof! scheduleService#
   * @param {String} link - the team web schedule URL 
   * @return {Boolean} true|false
   */
  function addWebScheduleLink (link) {
    if (typeof link != "undefined") { 
      ss.getRangeByName("webLink").setValue(link); 
    }
  }
  
/******************************************************************************
*                                  @private                                   *
******************************************************************************/

  /**
   * ---
   * Moves the game RSVPs when a new game column gets added within the
   * previously scheduled games. Only handles future game dates.
   * 
   * | game_rsvps.forEach | type | value kind
   * |---|---|---
   * | `game_rsvps.e[0]` | {Date} | date
   * | `game_rsvps.e[1]` | {Array} | rsvplist
   *
   * @param {Array} game_rsvps - each game columns' rsvps by `[game_date, [[row rsvp]]]`
   */
  function _resetRSVPColumns (game_rsvps) {
    var current_sheet = ss.getSheets()[0];
    var rsvp_range = ss.getRangeByName("rsvpRange");
    var today = new Date();
    var isClear = false;
    var next_gameday_col = getNextGameDayCols()[0][0][0];
    var request_data = [];

    game_rsvps.forEach(function (e, i) {
      var game_date = new Date(e[0]);
      
      // Only work with upcoming games
      if (game_date >= today) {
        var current_column = schedule().gameColumn(e[0]);
        
        if (isClear == false) {
          var clearRange = current_sheet.getRange(rsvp_range.getRow(), 
                                                  next_gameday_col, 
                                                  rsvp_range.getNumRows(), 
                                                  (game_rsvps.length - i));
          clearRange.clear({contentsOnly: true});
          isClear = true;
        }
        // Skip if rsvp replies are empty
        if (e[1].length != 0) {
          var game_rsvp_range = current_sheet.getRange(rsvp_range.getRow(), current_column, e[1].length);
          
          // Build the update object
          var request = {
            "range": game_rsvp_range.getA1Notation(),
            "majorDimension": "COLUMNS",
            "values": [e[1]]
          };
          
          // Store the update objects for an API batchUpdate
          request_data.push(request);
        }
      }
    });
    
    // Finish building the batchUpdate object
    var batch_request = {
      "valueInputOption": "RAW",
      "data": request_data
    };
    
    // Use exponential backoff to account for untimely server issues
    utils(ss).script.retry(function() {
      var response = Sheets.Spreadsheets.Values.batchUpdate(batch_request, ss_id);
    });
  }
  
  /**
   * @typedef {scheduleService} scheduleService.PublicInterface
   * @property {Function} isScheduleRangeBlank - [scheduleService().isScheduleBlank()]{@link scheduleService#isScheduleRangeBlank}
   * @property {Function} getNextGameDayCols - [scheduleService().nextGameDay()]{@link scheduleService#getNextGameDayCols}
   * @property {Function} addWebScheduleLink - [scheduleService().setWebLink()]{@link scheduleService#addWebScheduleLink}
   * @property {Function} updateSchedule - [scheduleService().update()]{@link scheduleService#updateSchedule}
   */
  return {
    isScheduleBlank: isScheduleRangeBlank,
    nextGameDay: getNextGameDayCols,
    setWebLink: addWebScheduleLink,
    update: updateSchedule.bind(game(ss)),
  }
}