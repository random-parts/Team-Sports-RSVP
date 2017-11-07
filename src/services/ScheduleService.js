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
    var c_shortformat = utils(ss,tz).date.format("short", composite_dates);
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
        var a = c_shortformat[this.column];
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
        this.date = utils(ss,tz).date.makeDateTime(s[i][0], s[i][4]);
      } else if (!this.date) {
        try { this.date = s[i][0].replace(/-/, " ") } 
         catch (e) {}
      }
    }
    
  /*  END UPDATE SCHEDULE LOOP - finish running updateSchedule 
  *******************************************************************************/

    // Apply pending Spreadsheet changes
    SpreadsheetApp.flush();

    // Reset the rsvp columns to adjust for changes/additions to the schedule if needed.
    // Only runs if there is an addition to to the displayed schedule.
    // May cause rsvp column position problems if games are set and then after some time 
    //   are removed without having been cancelled out.
    /** @todo Handle rsvp actions when games are deleted without being cancelled out */
    if (gameday_values.length && ((s.length + column_offset) > gameday_values.length)) {
      _resetRSVPColumns(gameday_values);
    }
    
    // Set the column highlight on the next gameday game columns
    this.column = getNextGameDayCols()[0][0];
    this.highlightGame();
  }

  /**
   * ---
   * Gets all of the seasons scheduled bye-weeks based on
   * the most common gameday day-of-the-week that games are scheduled on.
   *
   * @param {Array=} dates - compsite schedule dates (default: composite dates)
   * @param {Boolen=} filter_future - filter old dates out (default: false)
   * @return {Array}
   * ```
   * [i][0] date as day of year
   * [i][1] date as date object (day,month,year)
   * ```
   */
  function getByeWeekDates (dates, filter_future) {
    var dates = dates || schedule(ss).compositeDates();
    var filter_future = filter_future || false;
    var gamedays_of_week = utils(ss,tz).date.format("weekday", dates);
    var common_day = utils(ss,tz).getMostCommon(gamedays_of_week);
      if (!common_day[2]) { return null }
    var gamedays_of_year = utils(ss,tz).date.format("yearday", dates);
    var diff, byeweek_list = [], curr_date = new Date();

    for (var i = 0; i < dates.length; i++) {
       // When more than 7 days between games add the byeweek date to list
      if (gamedays_of_year[i + 1]
           && (gamedays_of_year[i + 1] - gamedays_of_year[i] > 7)) {

        diff = (gamedays_of_week[i] - common_day[0][0]) || 0;
        curr_date = new Date(dates[i]);

        do {
          curr_date.setDate(curr_date.getDate() + (7 - diff));
          var bye_weekday = utils(ss,tz).date.format("weekday", curr_date)[0];
          var bye_yearday = utils(ss,tz).date.format("yearday", curr_date)[0];
          diff = (bye_weekday - common_day[0][0]) || 0;

          // Check that the bye-week game is not scheduled & add it to the list
          (gamedays_of_year.indexOf(bye_yearday) == -1)
            ? byeweek_list.push([bye_yearday, new Date(curr_date)]) : null;

          // Do while there are consecutive bye-weeks
        } while ((bye_yearday + 7) < gamedays_of_year[i + 1]);
      }
    }

    if (filter_future) {
      var today = utils(ss,tz).date.format("yearday")[0];
      return byeweek_list.filter(function (e) { return e[0] >= today });

    } else { return byeweek_list; }
  }

  /**
   * ---
   * Finds the next active game from date
   * and returns composite game infomation.
   *
   * @memberof! scheduleService#
   * @param {Date=} date - date to use for finding games (default: today)
   * @return {Array}
   * ```
   * [i][0] Game {n}\n Field
   * [i][1] Date [ 'dddd\n" "mmm" "dd' ]
   * [i][2] [ time | score | "Cancelled" ]
   * [i][3] opponent [ **bold** => Home team ]
   * ```
   */
  function getNextActiveGame (date) {
    var date = date || new Date();
    var next_gameday = scheduleService().nextGameDay(99, date);
      if (typeof next_gameday[0] == "undefined") { return }
    var n_cols = next_gameday.reduce(function (r, e) { return r.concat(e[0]) }, []);
    var game_info = schedule(ss).composite.apply(null, n_cols);
    var i = 0;
    // Find the next game that is not `Cancelled`
    while (typeof game_info[i] != "undefined" && game_info[i][0] == "Cancelled") { i++ }

    return game_info[i];
  }

  /**
   * ---
   * Finds the next/upcoming gameday and places all games
   * scheduled for that day into an array by the games column position
   *
   * @memberof! scheduleService#
   * @param {Number=} days - number of additional gamedays to return (Default: 0)
   * @param {Date=} date - date to use for finding games (Default: today)
   * @return {Array}
   * ```
   * [i][0][i] column positions
   * [i][1][i] date Object
   * ```
   */
  function getNextGameDayCols (days, date) {
    var days = days || 0;
    var date = date || new Date();
    var c_dates = schedule(ss).compositeDates();
    var today = utils(ss,tz).date.format("yearday", date)[0];
    var yearday = utils(ss,tz).date.format("yearday", c_dates);
    var game_columns = [], game_dates = [], game_day = [];

    // Compares current column with next column for multiple games in one day
    for (var i = 0; i < yearday.length; i++) {
      var current_date = yearday[i];
      var n_date = (typeof yearday[i + 1] != "undefined")
                     ? yearday[i + 1] : false;

      if (current_date >= today && c_dates[i] != "") {
        game_dates.push(c_dates[i]);
        game_columns.push(schedule(ss).gameColumn(c_dates[i]));
        // Exit if the next day was found and there are no more days needed
        if (current_date != n_date) {
          game_day.push([game_columns, game_dates]);
          game_columns = [], game_dates = [];
          if (days-- <= 0) { break }
        }
      }
    }

    return game_day;
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
    var rsvp_row = rsvp_range.getRow();
    var rsvp_numrows = rsvp_range.getNumRows();
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
          var clearRange = current_sheet.getRange(rsvp_row,
                                                  next_gameday_col,
                                                  rsvp_numrows,
                                                  (game_rsvps.length - i));
          clearRange.clear({contentsOnly: true});
          isClear = true;
        }
        // Skip if rsvp replies are empty
        if (e[1].length != 0) {
          var game_rsvp_range = current_sheet.getRange(rsvp_row, current_column, e[1].length);

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

    // Apply pending Spreadsheet changes
    SpreadsheetApp.flush();
  }
  
  /**
   * @typedef {scheduleService} scheduleService.PublicInterface
   * @property {Function} getByeWeekDates - [scheduleService().getByeWeeks()]{@link scheduleService#getByeWeekDates}
   * @property {Function} isScheduleRangeBlank - [scheduleService().isScheduleBlank()]{@link scheduleService#isScheduleRangeBlank}
   * @property {Function} getNextActiveGame - [scheduleService().nextActiveGame()]{@link scheduleService#getNextActiveGame}
   * @property {Function} getNextGameDayCols - [scheduleService().nextGameDay()]{@link scheduleService#getNextGameDayCols}
   * @property {Function} addWebScheduleLink - [scheduleService().setWebLink()]{@link scheduleService#addWebScheduleLink}
   * @property {Function} updateSchedule - [scheduleService().update()]{@link scheduleService#updateSchedule}
   */
  return {
    getByeWeeks: getByeWeekDates,
    isScheduleBlank: isScheduleRangeBlank,
    nextActiveGame: getNextActiveGame,
    nextGameDay: getNextGameDayCols,
    setWebLink: addWebScheduleLink,
    update: updateSchedule.bind(game(ss)),
  }
}