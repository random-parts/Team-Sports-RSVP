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
  var team_name = team(ss).name;
  var tz = ss.getSpreadsheetTimeZone();
  var sets = {
    log: curateLogEmails,
    next: curateNextGameEmails,
    other: curateManualEmails,
    today: curateTodaysEmails,
  }

  /**
   * ---
   * Creates and sends emails.
   *
   * @memberof! emailService#
   * @param {String=} [set_type] - type of mail set to work with
   * @param {?=} argument[1] - option arguments for the set method
   */
  function sendMail (set_type) {
    var set_type = set_type || "today";
    var arg = arguments[1] || null;
    var email_sets = sets[set_type] ? sets[set_type].call(email(),arg) : null;
      if (!email_sets) { return }
    var ss_url = ss.getUrl();
    var sent_log = [];

    for (var email_type in email_sets) {
      // Only process emails when there is a valid email list
      if (email_sets[email_type].email.length) {
        /**
         * Process each {email_type[]}'s set of emails
         * @this email()
         */
        email_sets[email_type].email.forEach(function (e) {
          this.log = e.log;
          this.time_zone = tz;
          this.team_name = e.team_name;
          this.email_type = email_type;
          this.subject = e.subject;
          this.game_field = e.game_field;
          this.sheets_url = ss_url;
          this.game_date = e.game_date;
          this.game_time = e.game_time;
          this.game_opp = e.game_opp;
          if (typeof email_sets[email_type].next_game != "undefined") {
            this.next_date = email_sets[email_type].next_game[1];
            this.next_number = email_sets[email_type].next_game[0].split('\n')[0];
            this.next_time = email_sets[email_type].next_game[2];
            this.next_opp = email_sets[email_type].next_game[3];
            this.next_field = email_sets[email_type].next_game[0].split('\n')[1];
          }
          // Create and send the above email for each email address in `e.to_send`
          for (var i = 0; i < e.to_send.length; i++) {
            if (email_type == "Rsvp" || email_type == "Returning") {
              this.first_name = e.to_send[i][0][0];
              this.email = e.to_send[i][0][1];
              this.yes_link = e.to_send[i][1][0];
              this.probably_link = e.to_send[i][1][1];
              this.doubtful_link = e.to_send[i][1][2];
              this.no_link = e.to_send[i][1][3];
            } else {
              this.first_name = e.to_send[i][0];
              this.email = e.to_send[i][1];
            }
            // Use exponential backoff to account for untimely server issues
            var log = utils(ss,tz).script.retry(this.send);

            // Collect the email log
            if (typeof log != 'undefined') { sent_log.push(log) }
          }
        }, email());
      }
    }
    // Set the collection of email logs
    storage().log.set("email", sent_log);
  }

  /**
   * ---
   * Gathers the sent log email
   *
   * @memberof! emailService#
   * @this email()
   * @return {
   *   Log: {
   *     email:Array.<{length}>
   *   }
   * }
   */
  function curateLogEmails () {
    var email_logs = storage().log.get("email");
    var e_log = [];

    if (email_logs) {
      this.email = [["Email-Log Task", ss.getOwner().getEmail()]];
      this.team_name = team_name;
      this.log = email_logs;

      e_log.push(this.logEmail());
    }
    return {
      Log: {
        email: e_log
      }
    }
  }

  /**
   * ---
   * Gathers all emails that are not strictly `datetime` sensitive
   *
   * @memberof! emailService#
   * @this email()
   * @param {String=} type - type of email requested
   * @return {
   *   Debt: {
   *     email:Array.<{length}>,
   *     next_game: Array[]
   *   },
   *   Returning: {
   *     email: Array.<{length}>
   *   }
   * }
   */
  function curateManualEmails (type) {
    var type = (typeof type != "undefined") ? type.toLowerCase() : "";
    var squad_emails = squad(ss).emails();
      if (!squad_emails[1].length) { return }
    var next_game, debt = [], returning = [];

    // Set common values for manual/other emails
    this.team_name = team_name;

    switch (true) {
      //** Get Debt emails **//
      case type == "debt":
        this.email = _getDebtInfo(squad_emails);
        debt.push(this.debtEmail());
        next_game = scheduleService().nextActiveGame();
        break;

      //** Get Returning squad emails **//
      case type == "returning":
        this.email = _getReturningInfo(squad_emails);
        returning.push(this.returningEmail());
        break;

      default:
        //
    }

    return {
      Debt: {
        email: debt,
        next_game: next_game
      },
      Returning: {
        email: returning
      }
    }
  }

  /**
   * ---
   * Gathers all of the emails for the `nextGameDay()`,
   * and/or bye-week, regardless if `_isEmailDay()` or not.
   *
   * @memberof! emailService#
   * @this email()
   * @return {
   *   Byeweek: {
   *     email:Array.<{length}>,
   *     next_game: Array[]
   *   },
   *   Cancelled: {
   *     email:Array.<{length}>,
   *     next_game: Array[]
   *   },
   *   Rsvp: {
   *     email: Array.<{length}>
   *   }
   * }
   */
  function curateNextGameEmails () {
    var squad_emails = squad(ss).emails();
      if (!squad_emails[1].length) { return }
    var n_gameday = scheduleService().nextGameDay();
      if (typeof n_gameday[0] == "undefined") { return }
    var byeweeks = scheduleService().getByeWeeks(null, true) || [];
    var next_cols = n_gameday.reduce(function (r, e) { return r.concat(e[0]) }, []);
    var game_info = schedule(ss).composite.apply(null, next_cols);
    var bye_week = [], cancelled = [], rsvp = [];
    // Set common values
    this.team_name = team_name;
    this.email = squad_emails[1];

    //** Check for Bye-week Emails **//
    if (byeweeks.length) {
      var n_yearday = utils(ss,tz).date.format("yearday", n_gameday[0][1][0]);
      var today = utils(ss,tz).date.format("yearday")[0];
      // Check if there is a Bye-week before the next gameday
      if (n_yearday[0] > (byeweeks[0][0] + 7) && byeweeks[0][0] > today) {
        // Set values for byeweek game only
        var g_date = utils(ss,tz).date.format("split",
                                              new Date(byeweeks[0][1].toDateString()));
        this.game_date = g_date[0][0];
        // Add the byeweek game set
        bye_week.push(this.byeweekEmail());
        // Get the next active game
        var next_game = next_game || scheduleService().nextActiveGame(byeweeks[0][1]);
      }
    }
    // Loop through the first "n_gameday" games only
    for (var i = 0; i < n_gameday[0][0].length; i++) {
      var game_date = utils(ss,tz).date.format("split", n_gameday[0][1][i])[0];
      // Set common values for next gameday
      this.game_field = game_info[i][0].split('\n')[1];
      this.game_opp = game_info[i][3];
      this.game_date = game_date[0];
      this.game_time = game_date[1];

      //** Get the Cancelled Email info/Set **//
      if (game_info[i][0] == "Cancelled") {
        // Add the cancelled game set
        cancelled.push(this.cancelledEmail());
        // Get the next active game
        var next_game = next_game || scheduleService().nextActiveGame(n_gameday[0][1][i]);
      } else {
        //** Get the RSVP Email info/Set **//
        this.email = _getRSVPInfo(n_gameday[0][1][i], n_gameday[0][0][i], squad_emails);

        // Add the rsvp game set
        rsvp.push(this.rsvpEmail());
      }
    }

    return {
      Byeweek:  {
        email: bye_week,
        next_game: next_game
      },
      Cancelled: {
        email: cancelled,
        next_game: next_game
      },
      Rsvp: {
        email: rsvp
      }
    }
  }
  /**
   * ---
   * Gathers all of the email sets that should be sent today.
   *
   * @memberof! emailService#
   * @this email()
   * @return {
   *   Byeweek: {
   *     email:Array.<{length}>,
   *     next_game: Array[]
   *   },
   *   Cancelled: {
   *     email:Array.<{length}>,
   *     next_game: Array[]
   *   },
   *   Debt: {
   *     email:Array.<{length}>,
   *     next_game: Array[]
   *     },
   *   Returning: {
   *     email: Array.<{length}>,
   *     next_game: Array[]
   *   },
   *   Rsvp: {
   *     email: Array.<{length}>
   *   }
   * }
   */
  function curateTodaysEmails () {
    var squad_emails = squad(ss).emails();
      if (!squad_emails[1].length) { return }
    var game_info = schedule(ss).composite();
    var c_dates = schedule(ss).compositeDates();
    var today = utils(ss,tz).date.format("yearday")[0];
    var byeweeks = scheduleService().getByeWeeks(c_dates, true) || [];
    var current_games = utils(ss,tz).date.format("yearday", c_dates);
    var total_games = c_dates.length;
    var skip_debt = false, skip_returning = false;
    var bye_week = [], cancelled = [], debt = [],
        returning = [], rsvp = [];

    for (var i = 0; i < total_games; i++) {
      // Only process games in the future
      if (current_games[i] < today) { continue }
      // Set common values for byeweek and current game
      this.team_name = team_name;
      this.game_field = game_info[i][0].split('\n')[1];
      this.game_opp = game_info[i][3];
      this.email = squad_emails[1];

      //** Check for Bye-week Emails **//
      if (byeweeks.length && current_games[i - 1]) {
        // Check that Bye-week is between the previous and current game
        if (current_games[i - 1] < byeweeks[0][0] && byeweeks[0][0] < current_games[i]) {
          if (_isEmailDay(byeweeks[0][0], today)) {
            // Set values for byeweek game only
            var g_date = utils(ss,tz).date.format("split",
                                                  new Date(byeweeks[0][1].toDateString()));
            this.email = squad_emails[1];
            this.game_date = g_date[0][0];
            // Add the byeweek game set
            bye_week.push(this.byeweekEmail());
            // Get the next active game
            var next_game = next_game || scheduleService().nextActiveGame(c_dates[i]);
          }
        }
      }

      //** Check if other emails should be sent today **//
      if (_isEmailDay(current_games[i], today)) {

        //** Check for Returning Emails **//
        if (!skip_returning && (total_games - 3) > 0 && (total_games - i) <= 3) {
          this.email = _getReturningInfo(squad_emails);
          // Add the returning squad email set
          returning.push(this.returningEmail());
          // Get the next active game
          var next_game = next_game || scheduleService().nextActiveGame(c_dates[i]);
          // Skip after first run
          skip_returning = true;
        }

        //** Check for Debt/Payment Emails **//
        if (!skip_debt && i <= 3) {
          this.email = _getDebtInfo(squad_emails);
          // Add the payment email set
          debt.push(this.debtEmail());
          // Get the next active game
          var next_game = next_game || scheduleService().nextActiveGame(c_dates[i]);
          // Skip after first run
          skip_debt = true;
        }

        // Set values for current game only (rsvp or cancelled)
        var game_date = utils(ss,tz).date.format("split", c_dates[i])[0];
        this.game_date = game_date[0];
        this.game_time = game_date[1];

        //** Check for Cancelled Emails **//
        if (game_info[i][0] == "Cancelled") {
          this.email = squad_emails[1];
          // Add the cancelled game set
          cancelled.push(this.cancelledEmail());
          // Get the next active game
          var next_game = next_game || scheduleService().nextActiveGame(c_dates[i]);
          continue;
        }

        //** Check for RSVP Emails **//
        var game_col = schedule(ss).gameColumn(c_dates[i]);
        // Get the rsvp email set with prefilled links
        this.email = _getRSVPInfo(c_dates[i], game_col, squad_emails);
        // Add the rsvp game set
        rsvp.push(this.rsvpEmail());
      }
    }

    return {
      Byeweek:  {
        email: bye_week,
        next_game: next_game
      },
      Cancelled: {
        email: cancelled,
        next_game: next_game
      },
      Debt: {
        email: debt,
        next_game: next_game
      },
      Returning: {
        email: returning,
        next_game: next_game
      },
      Rsvp: {
        email: rsvp
      }
    }
  }

/******************************************************************************
*                                  @private                                   *
******************************************************************************/

  /**
   * ---
   * Gathers the Email info for current squad mates
   * that have not yet paid their season fees.
   *
   * @param {String[][]} emails - current squad mates `[name, email]`
   * @return {Array}
   * ```
   * [0] name
   * [1] email
   * ```
   */
  function _getDebtInfo (emails) {
    var send_list = [];
    var paid = squad(ss).getPaidRows();

    if (paid.filter(String).length) {
      // Match empty cells in the paid column with email addresses
      for (var i = 0; i < emails[0].length; i++) {
        if (!paid[i]) {
          // Get all squad mate emails that have not paid
          (typeof emails[0][i][1] != "undefined") ? send_list.push(emails[0][i]) : null;
        }
      }
    } else { send_list = emails[1]; }

    return send_list;
  }

  /**
   * ---
   * Gathers the Email info for current squad mates
   * that have not yet decided if they are playing next season
   * and returns with prefilled form links.
   *
   * @param {String[][]} emails - current squad mates `[name, email]`
   * @return {Array}
   * ```
   * [0][i][i] [name, email]
   * [1][i][i] [link,link,link,link]
   * ```
   */
  function _getReturningInfo (emails) {
    var send_list = [], sendmail_sets = [];
    var r = squad(ss).getReturningRows();

    if (r.filter(String).length) {
      // Match empty cells in the returning/Next? column with email addresses
      for (var i = 0; i < emails[0].length; i++) {
        if (!r[i]) {
          // Get all squad mate emails that have not deceid if they are returning
          (typeof emails[0][i][1] != "undefined") ? send_list.push(emails[0][i]) : null;
        }
      }
    } else { send_list = emails[1]; }
    /**
     * Get each `Returning/Next?` emails' Pre-filled form links
     *
     * @inner
     * @this form()
     */
    send_list.forEach(function (e) {
      this.team_form = Config.team_form();
      this.game_date = "returning";
      this.email_address = e[1];

      sendmail_sets.push([e, this.prefilledLinks()]);
    }, form());

    return sendmail_sets;
  }

  /**
   * ---
   * Gathers the RSVP Email List with prefilled links
   * for the squad mates that have not yet RSVP to the upcoming game.
   *
   * @param {Date} game_datetime - games' date object
   * @param {Number} game_col - the column position of the game
   * @param {String[][]} emails - current squad mates `[name, email]`
   * @return {Array}
   * ```
   * [0][i][i] [name, email]
   * [1][i][i] [link,link,link,link]
   * ```
   */
  function _getRSVPInfo (game_datetime, game_col, emails) {
    var game_date = utils(ss,tz).date.format("split", game_datetime)[0];
    var rsvp_col = schedule(ss).rsvp.call(null, game_col);
    var send_list = [], sendmail_sets = [];

    // Get the proper to:email list
    if (typeof rsvp_col == "undefined") {
      // Get all vaild squad emails
      send_list = emails[1];
    } else {
      // Match empty cells in the game column with email addresses
      for (var i = 0; i < emails[0].length; i++) {
        if (!rsvp_col[0][i]) {
          // Get email of squad mates that have not rsvp'd
          (typeof emails[0][i][1] != "undefined") ? send_list.push(emails[0][i]) : null;
        }
      }
    }
    /**
     * Get each RSVP emails' Pre-filled form links
     *
     * @inner
     * @this form()
     */
    send_list.forEach(function (e) {
      this.team_form = Config.team_form();
      this.game_date = game_datetime;
      this.email_address = e[1];

      sendmail_sets.push([e, this.prefilledLinks()]);
    }, form());

    return sendmail_sets;
  }

  /**
   * ---
   * Check if an email should be sent for the specified dates
   *
   * @param {Date.<number>} gamedate - day number of year
   * @param {Date.<number>} today - day number of year
   * @return {Boolean}
   */
  function _isEmailDay (gamedate, today) {
    var event = gamedate || -999;
    var email_days = settings().email.daysBeforeGame;

    return email_days.indexOf((event - today)) != -1;
  }

  /**
   * @typedef {emailService} emailService.PublicInterface
   * @property {Funtion} sendMail - [emailService().sendMail()]{@link emailService#sendMail}
   */
  return {
    sendMail: sendMail
  }
}
