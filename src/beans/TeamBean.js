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
 * @overview Get and set team organization information
 * @license Apache License, Version 2.0
 * @property {team.PublicInterface} - available public methods
 */

/**
 * ** Team Bean Object **
 *
 * @namespace team
 * @property {team.PublicInterface} - available public methods
 * @param {Spreadsheet} spreadsheet - a spreadsheet object
 */
function team (spreadsheet) {
  var spreadsheet;
  var ss = spreadsheet || Config.spreadsheet();
  var teamname_range = ss.getRangeByName("teamName");
  var name;
  
  /**
   * @typedef {team} team.PublicInterface
   * @property {String} name - (Accessor|Mutator) team name
   */
  return {
    get name() { return teamname_range.getValue() },
    set name(val) { name = val; teamname_range.setValue(val); SpreadsheetApp.flush() }
  }
}