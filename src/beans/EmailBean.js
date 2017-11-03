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
 * @overview Creates, sets and sends individual emails.
 * @license Apache License, Version 2.0
 * @property {email.PublicInterface} - available public methods
 */

/**
 * ** Email Bean Object  **
 *
 * @namespace email
 * @property {email.PublicInterface} - available public methods
 */
function email () {
  var email, email_type, first_name, game_field, game_date, game_opp, game_time, log,
      next_date, next_field, next_number, next_opp, next_time, sheets_url, subject,
      team_name,templates, time_zone, yes_link, probably_link, doubtful_link, no_link;
  var type = {
        Byeweek: { html: "email_byeweek", plain_text: "email_byeweek_text", color: "gray" },
        Cancelled: { html: "email_cancelled", plain_text: "email_cancelled_text" , color: "hotpink" },
        Debt: { html: "email_debt", plain_text: "email_debt_text" , color: "firebrick" },
        Log: { html: "email_log", plain_text: "email_log_text" , color: "black" },
        Returning: { html: "email_returning", plain_text: "email_returning_text" , color: "purple" },
        Rsvp: { html: "email_rsvp", plain_text: "email_rsvp_text" , color: "darkblue" }
      }

  /**
   * ---
   * Sends the actual email out.
   *
   * @memberof! email#
   * returns {Object}
   */
  function sendEmail () {
    var mail_quota = MailApp.getRemainingDailyQuota();
    var html_body = HtmlService.createTemplateFromFile(type[email_type].html)
                               .evaluate().getContent();
    var text_body = HtmlService.createTemplateFromFile(type[email_type].plain_text)
                               .evaluate().getContent();

    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: text_body,
      htmlBody: html_body
    });

    // Log email if the send mail_quota was not at zero
    if (mail_quota != 0 && email_type != "Log") {
      var email_log = {
        team_name: team_name,
        email_type: email_type,
        subject: subject,
        first_name: first_name,
        email_address: email,
        timestamp: new Date()
      }
    }

    return email_log;
  }

  /**
   * ---
   * Gathers the bye-week Email data
   *
   * @return {Undefined|Object} obj
   *           {String} obj.subject
   *           {String} obj.team_name
   *           {String} obj.game_date
   *           {String[][]} obj.to_send
   */
  function getByeweekEmail () {
    var obj = {};
    obj.subject = "NO " + team_name + " game on " + game_date;
    obj.team_name = team_name;
    obj.game_date = game_date;
    obj.to_send = email;

    return obj;
  }

  /**
   * ---
   * Gathers the cancelled Email data
   *
   * @return {Object} obj
   *           {String} obj.subject
   *           {String} obj.team_name
   *           {String} obj.game_opp
   *           {String} obj.game_date
   *           {String} obj.game_time
   *           {String[][]} obj.to_send
   */
  function getCancelledEmail () {
    var obj = {};
    obj.subject = "CANCELLED: " + team_name + ", " + game_date + " @ " +  game_time;
    obj.team_name = team_name;
    obj.game_opp = game_opp;
    obj.game_date = game_date;
    obj.game_time = game_time;
    obj.to_send = email;

    return obj;
  }

  /**
   * ---
   * Gathers the payment due Email data
   *
   * @return {Object} obj
   *           {String} obj.subject
   *           {String} obj.team_name
   *           {String[][]} obj.to_send
   */
  function getDebtEmail () {
    var obj = {};
    obj.subject = team_name + " team fees are due";
    obj.team_name = team_name;
    obj.to_send = email;

    return obj;
  }

  /**
   * ---
   * Gathers the Logs Email data
   *
   * @return {Object} obj
   *           {String} obj.subject
   *           {String} obj.log
   *           {String[][]} obj.to_send
   */
  function getLogEmail () {
    var obj = {};
    obj.subject = team_name + " :: Sent Email Logs";
    obj.log = log;
    obj.to_send = email;

    return obj;
  }

  /**
   * ---
   * Gathers the returning next season Email data
   *
   * @return {Object} obj
   *           {String} obj.subject
   *           {String} obj.team_name
   *           {String[][]} obj.to_send
   */
  function getReturningEmail () {
    var obj = {};
    obj.subject = team_name + " will be returning!";
    obj.team_name = team_name;
    obj.to_send = email;

    return obj;
  }

  /**
   * ---
   * Gathers the RSVP game Email data
   *
   * @return {Object} obj
   *           {String} obj.subject
   *           {String} obj.team_name
   *           {String} obj.game_field
   *           {String} obj.game_opp
   *           {String} obj.game_date
   *           {String} obj.game_time
   *           {String[][]} obj.to_send
   */
  function getRsvpEmail () {
    var obj = {};
    obj.subject = team_name + ", " + game_date + " @ " + game_time;
    obj.team_name = team_name;
    obj.game_field = game_field;
    obj.game_opp = game_opp;
    obj.game_date = game_date;
    obj.game_time = game_time;
    obj.to_send = email;

    return obj;
  }

  /**
   * @typedef {email} email.PublicInterface
   * @property {Funtion} sendEmail - [email().send()]{@link email#sendEmail}
   * @property {Funtion} getByeweekEmail - [email().byeweekEmail()]{@link email#getByeweekEmail}
   * @property {Funtion} getCancelledEmail - [email().cancelledEmail()]{@link email#getCancelledEmail}
   * @property {Funtion} getDebtEmail - [email().debtEmail()]{@link email#getDebtEmail}
   * @property {Funtion} getLogEmail - [email().logEmail()]{@link email#getLogEmail}
   * @property {Funtion} getReturningEmail - [email().returningEmail()]{@link email#getReturningEmail}
   * @property {Funtion} getRsvpEmail - [email().rsvpEmail()]{@link email#getRsvpEmail}
   * @property {Object} type - (Accessor)
   * @property {Array|String} email - (Mutator)
   * @property {String} email_type - (Mutator)
   * @property {String} first_name - (Mutator)
   * @property {Date} game_date - (Mutator)
   * @property {String} game_opp - (Mutator)
   * @property {Date} game_time - (Mutator)
   * @property {Object} log - (Mutator)
   * @property {String} next_date - (Mutator)
   * @property {String} next_field - (Mutator)
   * @property {String} next_number - (Mutator)
   * @property {String} next_opp - (Mutator)
   * @property {String} next_time - (Mutator)
   * @property {String} subject - (Mutator)
   * @property {String} team_name - (Mutator)
   * @property {String} sheets_url - (Mutator)
   * @property {String} time_zone - (Mutator)
   * @property {String} yes_link - (Mutator)
   * @property {String} probably_link - (Mutator)
   * @property {String} doubtful_link - (Mutator)
   * @property {String} no_link - (Mutator)
   */
  return {
    send: sendEmail,
    byeweekEmail: getByeweekEmail,
    cancelledEmail: getCancelledEmail,
    debtEmail: getDebtEmail,
    logEmail: getLogEmail,
    returningEmail: getReturningEmail,
    rsvpEmail: getRsvpEmail,
    //
    get type () { return type },
    set email (val) { email = val },
    set email_type (val) { email_type = val },
    set first_name (val) { first_name = val.split(" ").slice(0, -1).join(" ") },
    set game_field (val) { game_field = val },
    set game_date (val) { game_date = val },
    set game_opp (val) { game_opp = val },
    set game_time (val) { game_time = val },
    set log (val) { log = val },
    set next_date (val) { next_date = val.replace("\n", "") },
    set next_field (val) { next_field = val },
    set next_number (val) { next_number = val },
    set next_opp (val) { next_opp = val },
    set next_time (val) { next_time = val },
    set subject (val) { subject = val },
    set team_name (val) { team_name = val },
    set sheets_url (val) { sheets_url = val },
    set time_zone (val) { time_zone = val },
    set yes_link (val) { yes_link = val },
    set probably_link (val) { probably_link = val },
    set doubtful_link (val) { doubtful_link = val },
    set no_link (val) { no_link = val }
  }
}
