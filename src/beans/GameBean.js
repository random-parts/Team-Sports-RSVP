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
 * @overview Creates and sets formatted game information by cell-column.
 * @license Apache License, Version 2.0
 * @property {game.PublicInterface} - available public methods
 */

/**
 * ** Game Bean Object **
 *
 * @namespace game
 * @property {game.PublicInterface} - available public methods
 * @param {Spreadsheet} spreadsheet - a spreadsheet object
 */
function game (spreadsheet) {
  var spreadsheet;
  var ss = spreadsheet || Config.spreadsheet();
  var game_range = ss.getRangeByName("gameRange");
  var rsvp_range = ss.getRangeByName("rsvpRange");
  var game_col = game_range.getColumn();
  var game_row = game_range.getRow();
  var game_cell = game_range.getCell(1, 1);
  var column = 0;
  var my_side, header, field, date, date_time, score, status, home_team, away_team;
  
  /**
   * ---
   * Find, format and set the game opponent into it's cell.
   * 
   * @memberof! game#
   */
  function formatOpp () {
    var opp_cell = game_cell.offset(3, column);
    opp = (my_side == "home") ? away_team : home_team;
    opp_cell.setValue(opp)
            .setBorder(null, true, true, true, true, true);
    
    if (my_side == "home") { opp_cell.setFontWeight("regular") }
     else { opp_cell.setFontWeight("bold") }
  }
  
  /**
   * ---
   * Sets the background to white and font color to black 
   * on individual game columns that have been removed.
   * 
   * @memberof! game#
   */
  function resetGameColumn () {
    var current_game = ss.getSheets()[0].getRange(1, (game_col + column), 4)
    current_game.clearContent();
    current_game.setBackground("white")
                .setFontColor("black")
                .setBorder(null, false, false, false, false, false);
  }
  
  /**
   * ---
   * Highlights the game columns for the upcoming gameday.
   * 
   * @memberof! game#
   */
  function highlightGameColumn () {
    try {
      var hl_range = ss.getSheets()[0].getRange(rsvp_range.getRow(),
                                                column[0],
                                                rsvp_range.getNumRows(),
                                                column.length);
      rsvp_range.setBackground("#FFFFFF");
      hl_range.setBackground("#FFFDDD");
    } 
    catch (e) { rsvp_range.setBackground("#FFFFFF") }
  }
  
  /**
   * ---
   * Formats and sets the game header into its cell.
   * 
   * @param {Array=} arguments[0] - Extra game info/venue (field name)
   */
  function _formatHeader () {
    var head_cell = game_cell.offset(0, column);
    var venue = arguments.length ?  arguments[0] : null
    head_cell.setValue(header + venue)
             .setFontWeight("regular")
             .setFontColor("white")
             .setBackground("#434343"); 
  }
  
  /**
   * ---
   * Formats and sets the game date into its cell.
   */
  function _formatDate () {
    var date_cell = game_cell.offset(1, column);
    date_cell.setValue(date)
             .setNumberFormat('dddd\n" "mmm" "dd')
             .setBorder(null, true, true, true, true, true);
  }
  
  /**
   * ---
   * Formats and sets cancelled game labels into cells.
   */
  function _formatCancelledGame () {
    var head_cell = game_cell.offset(0, column);
    var status_cell = game_cell.offset(2, column);
    head_cell.setValue("Cancelled")
             .setFontColor("black")
             .setFontWeight("regular")
             .setBackground("pink");
    status_cell.setValue("Cancelled")
               .setFontColor("black")
               .setFontWeight("regular")
               .setBackground("pink");
  }
  
  /**
   * ---
   * Reads the game status and sets the cell accordingly.
   * * Status types: 
   *   - {Time} HH:mm a
   *   - "Complete"
   *   - "Result Pending"
   *   - "Being Rescheduled" (possibly)
   */
  function _formatStatus () {    
    var status_cell = game_cell.offset(2, column);
    if (RegExp(/^[0-9]+/).test(status)) {
      status_cell.setValue(status)
                 .setBackground("#434343")
                 .setFontColor("yellow")
                 .setFontWeight("regular")
                 .setBorder(null, true, true, true, true, true);
    } else if (RegExp(/complete/i).test(status)) {
        status_cell.setValue(score)
                   .setBackground("white")
                   .setFontColor(_formatScoreColor(score))
                   .setFontWeight("bold")
                   .setBorder(null, true, true, true, true, true);
    } else if (RegExp(/pending/i).test(status)) {
        status_cell.setValue("Result Pending")
                   .setBackground("purple")
                   .setFontColor("yellow")
                   .setFontWeight("regular")
                   .setBorder(null, true, true, true, true, true);
    } else if (RegExp(/rescheduled/i).test(status)) {
        _formatCancelledGame();
    }
  }
  
  /**
   * ---
   * Checks the field column of the web schedule for the rescheduled notice
   * and sets the field/venue in the header if the game is not cancelled. 
   */
  function _formatField () {
    if (RegExp(/rescheduled/i).test(field)) { _formatCancelledGame() }
    var venue = '\n' + field;
    _formatHeader(venue);
  }
  
  /**
   * ---
   * Sets the `win|lose|tie` score font color based on my_team.
   *
   * @param {String} s - score
   */
  function _formatScoreColor (s) {
    var score = s.split("-");
    var color = Number(score[0]) >= Number(score[1]) 
        ? (Number(score[0]) > Number(score[1]) ? "home" : "tie")
        : "away";
    
    return color != "tie" ? (color == my_side ? "blue" : "red") : "green"; 
  }
 
  /**
   * @typedef {game} game.PublicInterface
   * @property {Funtion} resetGameColumn - [game().clear()]{@link game#resetGameColumn}
   * @property {Funtion} highlightGameColumn - [game().highlightGame()]{@link game#highlightGameColumn}
   * @property {Funtion} formatOpp - [game().opponent()]{@link game#formatOpp}
   * @property {Number} column - (Accessor|Mutator)
   * @property {String|Date} date - (Accessor|Mutator)
   * @property {String} field - (Accessor|Mutator)
   * @property {String} status - (Accessor|Mutator)
   * @property {String} away_team - (Mutator)
   * @property {String} header - (Mutator)
   * @property {String} home_team - (Mutator)
   * @property {String} my_side - (Mutator)
   * @property {String} score - (Mutator)
   */
  return {
    clear: resetGameColumn,
    highlightGame: highlightGameColumn,
    opponent: formatOpp,
    //
    get column() { return column },
    get date() { var date_cell = game_cell.offset(1, column); return date_cell.getValue() },
    get status() { return status },
    get field () { return field },
    set away_team(val) { away_team = val },
    set column(val) { column = val },
    set date(val) { date = val; _formatDate() },
    set header(val) { header = "Game " + val; _formatHeader() },
    set home_team(val) { home_team = val },
    set my_side(val) { my_side = val }, 
    set score(val) { score = val },
    set status(val) { status = val; _formatStatus() },
    set field (val) { field = val; _formatField() }
  }
}