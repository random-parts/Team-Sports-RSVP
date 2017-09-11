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
 * @overview Mananges the Email notification tasks
 * @license Apache License, Version 2.0
 * @property {emailService.PublicInterface} - available public methods
 */

/**
 * ** Email Service Object **
 *
 * @namespace emailService
 * @property {emailService.PublicInterface} - available public methods
 */
function emailService () {
  var ss = Config.spreadsheet();

  /**
   * ---
   * Send email notices for all games scheduled to be emailed today.
   * Email schedule is based on `settings().email.daysBeforeGame`.
   *
   * @memberof! emailService#
   */
  function sendMail () {
    var values = _getSendMailSets();
    var ss_url = ss.getUrl();
    /**
     * ---
     * Set & send each individual email
     *
     * @this email
     */
    values.forEach(function (e, oi) {
      // Only process emails when there is a valid email list
      if (e.to_send.length) {
        this.time_zone = ss.getSpreadsheetTimeZone();
        this.team_name = team().name;
        this.email_type = e.email_type;
        this.templates = _getEmailTemplates(e.email_type);
        this.sheets_url = ss_url;
        this.game_date = e.game_date;
        this.game_time = e.game_date;
        this.game_opp = e.game_opponent;

        for (var ii = 0; ii < e.to_send.length; ii++) {
          this.first_name = e.to_send[ii][0][0] || "";
          this.email = e.to_send[ii][0][1];

          if (e.email_type == "Rsvp") {
            this.yes_link = e.to_send[ii][1][0];
            this.probably_link = e.to_send[ii][1][1];
            this.doubtful_link = e.to_send[ii][1][2];
            this.no_link = e.to_send[ii][1][3];
          }

          var email_body = this.createMessage();

          this.html_body = HtmlService.createHtmlOutput(email_body[0].evaluate())
                                      .getContent();

          this.text_body = email_body[1].evaluate()
                                        .getContent();
          // Use exponential backoff to account for untimely server issues
          utils(ss).script.retry(this.send);
        }
      }
    }, email());
  }

/******************************************************************************
*                                  @private                                   *
******************************************************************************/ 
  
  /**
   * ---
   * Gets the html & plain text templates by email_type
   *
   * @param {String} type of template(s) to make
   * @return {Array}    
   * | return | value kind
   * |---|---
   * | template[0] | html template
   * | template[1] | plain text template
   */
  function _getEmailTemplates (type) {
    if (type == "Rsvp") {
      var html = HtmlService.createTemplateFromFile("email_rsvp");
      var plain_text = HtmlService.createTemplateFromFile("email_rsvp_text");
    } else if (type == "Cancelled") {
      var html = HtmlService.createTemplateFromFile("email_cancelled");
      var plain_text = HtmlService.createTemplateFromFile("email_cancelled_text");
    }

    return [html, plain_text];
  }
  
  /**
   * ---
   * Get the list of games to email by checking if the value between today and
   * the upcoming game matches a value in the `dayBeforeGame` setting.
   *
   * @return {Array}
   * | return | value kind
   * |---|---
   * | `games_to_email[0][i]` | Array of Game column positions
   * | `gamee_to_email[1][i]` | Array of Dates for games to email
   */
  function _getGamesToEmail () {
    var c_dates = schedule(ss).compositeDates();
    var email_days = settings().email.daysBeforeGame;
    var today = utils(ss).date.asDayOfYear(new Date());
    var game_dates = [];
    var game_columns = [];

    for (var i = 0; i < c_dates.length; i++) {
      var current_game = utils(ss).date.asDayOfYear(new Date(c_dates[i]));

      if (email_days.indexOf((current_game - today)) != -1) {
        game_dates.push(c_dates[i]);
        game_columns.push(schedule(ss).gameColumn(c_dates[i]));
      }
    }

    return [game_columns, game_dates];
  }

  /**
   * ---
   * Gathers the list of emails for the squad mates that have not yet
   * rsvp'd to the game(s) set to be emailed.
   *
   * @param {Array} squad_emails - squad list to match blank column rsvps
   * @param {Array} rsvp_games - games to check rsvps against
   * @return {Array} list of emails that have not rsvp'd
   */
  function _getSendList (squad_emails, rsvp_games) {
    var rsvp_col = schedule(ss).rsvp.apply(null, rsvp_games[0]);
    var squad_emails = squad_emails || [];
    var email_list = [];

    rsvp_games[0].forEach(function (e, oi) {
      var game_list = [];
      // When rsvp_col is empty email everyone
      if (typeof rsvp_col == "undefined" || typeof rsvp_col[oi] == "undefined") {
        // Filter squad rows without an email address
        email_list.push(squad_emails
                  .filter(function (r) { return (typeof r[1] != "undefined") }));
      } else {
        // Match empty cells in the game column with email addresses
        for (var ii = 0; ii < squad_emails.length; ii++) {
          if (!rsvp_col[oi][ii]) {
            (typeof squad_emails[ii][1] != "undefined")
              ? game_list.push(squad_emails[ii]) : null;
          }
        }
        email_list.push(game_list);
      }
    });

    return email_list;
  }
  
  /**
   * ---
   * Gathers the template values into per game objects
   * for today's email notifications
   *
   * @return {Array}
   * ```
   * //array of objects - of game data and sendmail value sets
   *
   * mail_sets = [{
   *   game_opponent: = {String}
   *   game_date: {Date},
   *   to_send: [[name, email], [[prefilled_links {@see form().prefilledLinks}]]]
   * }]
   * ```
   */
  function _getSendMailSets () {
    var rsvp_games = _getGamesToEmail();
    var game_info = schedule(ss).composite.apply(null, rsvp_games[0]);
    var squad_emails = squad(ss).emails();
    var send_list = _getSendList(squad_emails, rsvp_games);
    var filtered_emails = squad_emails.filter(function (e) { return (typeof e[1] != "undefined") })
    var mail_sets = [];

    /** 
     * oi > outer index is the game column
     * ii > inner index is the values/rows for that coulmn
     *
     * @this form
     */
    rsvp_games[1].forEach(function (e, oi) {
      var to_sendmail = [];
      var obj = {};
      
      this.team_form = Config.team_form();
      
      if (!send_list[oi].length) { return } // No emails to send for this game
      
      if (game_info[oi][0] != "Cancelled") {
        // Get the prefilled links for each squad mate that needs a game reminder
        for (var ii = 0; ii < send_list[oi].length; ii++) {
          this.game_date = e;
          this.email_address = send_list[oi][ii][1];
    
          to_sendmail.push([send_list[oi][ii], this.prefilledLinks()]);
        }
      
        obj.email_type = "Rsvp";

      } else {
        // Use all squad emails for cancelled game notifications
        // and set to the same to_send position as above
        for (var ii = 0; ii < filtered_emails.length; ii++) {
          to_sendmail.push([filtered_emails[ii]]);
        }
        
        obj.email_type = "Cancelled";
      }
      // Create the game object
      obj.game_opponent = game_info[oi][3];
      obj.game_date = e;
      obj.to_send = to_sendmail;

      mail_sets.push(obj);

    }, form());

    return mail_sets;
  }
  
  /**
   * @typedef {emailService} emailService.PublicInterface
   * @property {Funtion} sendEmail - [emailService().sendMail()]{@link emailService#sendEmail}
   */
  return {
    sendMail: sendMail
  }
}