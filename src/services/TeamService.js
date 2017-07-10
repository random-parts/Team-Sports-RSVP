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
 * @property {teamService.PublicInterface} - available public methods
 */

/**
 * **Team Service Object **
 *
 * @namespace teamService
 * @property {teamService.PublicInterface} - available public methods
 */
function teamService () {
  var ss = Config.spreadsheet();
  var ss_id = ss.getId();
  var sheet = ss.getSheets();
  
  /**
   * ---
   * Determines the team name based on the team recurring 
   * on the schedule most often.
   *
   * @memberof! teamService#
   * @this team
   */
  function findTeamName () { 
    const div_teams = [];
    const team_value = {};
    var s = schedule().raw();
    var i = 0, team_name;
    
    if (typeof s == "undefined") { return } //return nothing
  
    if (s.length > 1) {
      // Make array of all teams on schedule
      s.forEach(function (e) { div_teams.push(e[1], e[3]); });
      // Count # of times team names appears on schedule
      div_teams.forEach(function (e) {
        return team_value[e] = (team_value[e] || 0) + 1;
    });
      // Set my team name by the greatest value
      for (var key in team_value) {
        if (team_value[key] > i) {
          team_name = key;
          i = team_value[key];
        }
      }
    } else if (s.length = 1) {
        var confirm = prompt(s[0][1]);
   
        if (confirm) { team_name = s[0][1] }
         else if (confirm == false) { team_name = s[0][3] }
         else { return }
       
    } else { return }

    this.name = team_name;
  }
  
  /**
   * ---
   * Find the returning squad mates from the previous sheet 
   * and set them to the current/active sheet.
   *
   * @memberof! teamService#
   * @this squad
   */
  function setReturningSquad () {
    this.sheet_name = (typeof sheet[1] != "undefined") ? sheet[1].getName() : sheet[0].getName();

    var full_squad = this.full(this.sheet_name)

    if (typeof full_squad == "undefined") { return } // Exit if no squad exist

    // Map returning squad & blank place holders for non-returning squad
    var returning = full_squad.map(function (e, i) {
      return e = RegExp(/y+/i).test(e[2]) ? e : ["","","","",""];
    });

    this.returning = returning;
    this.sheet_name = sheet[0].getName();

    this.setReturningSquad();
  }
  
  /**
   * @typedef {teamService} teamService.PublicInterface
   * @property {Function} findTeamName - [teamService().updateName()]{@link teamService#findTeamName}
   * @property {Function} setReturningSquad - [teamService().squad.setReturning()]{@link teamService#setReturningSquad}
   */ 
  return {
    updateName: findTeamName.bind(team()),
    squad: {
      setReturning: setReturningSquad.bind(squad())
    }
  }
}