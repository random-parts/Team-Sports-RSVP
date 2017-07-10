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
  var templates, html_body, text_body, email_type, first_name, email, team_name, 
      game_date, game_time, game_opp, yes_link, probably_link, 
      doubtful_link, no_link, sheets_url, time_zone;

  /**
   * ---
   * Populates the email templates and return them
   * 
   * | array | value kind
   * |---|---
   * | `email_body[0]` | html
   * | `email_body[1]` | plain text
   * 
   * @memberof! email#
   * @return {Array} populated email templates
   */
  function createEmailMessage () {
    var email_body = [];

    if (typeof templates != "undefined") {
      templates.forEach(function (e) {
        e.team_name = team_name;
        e.game_date = game_date;
        e.game_time = game_time;
        e.sheets_url = sheets_url;
        // Added for Rsvp Emails
        e.first_name = first_name;
        e.game_opp = game_opp;
        e.yes_link = yes_link;
        e.probably_link = probably_link;
        e.doubtful_link = doubtful_link;
        e.no_link = no_link;
        
        email_body.push(e);
      });
    }

    return email_body;
  }
  
  /**
   * ---
   * Sends the actual email out.
   * 
   * @memberof! email#
   */
  function sendEmail () {
    MailApp.sendEmail({
      to: email,
      subject: team_name + " game " + game_date + " @ " + game_time,
      body: text_body,
      htmlBody: html_body
    });
  }

  /**
   * @typedef {email} email.PublicInterface
   * @property {Funtion} createEmailMessage - [email().createMessage()]{@link email#createEmailMessage}
   * @property {Funtion} sendEmail - [email().send()]{@link email#sendEmail}
   * @property {Array} templates - (Mutator)
   * @property {Object} html_body - (Mutator)
   * @property {Object} text_body - (Mutator)
   * @property {String} email_type - (Mutator)
   * @property {String} first_name - (Mutator)
   * @property {String} email - (Mutator)
   * @property {String} team_name - (Mutator)
   * @property {Date} game_date - (Mutator)
   * @property {Date} game_time - (Mutator)
   * @property {String} game_opp - (Mutator)
   * @property {String} yes_link - (Mutator)
   * @property {String} probably_link - (Mutator)
   * @property {String} doubtful_link - (Mutator)
   * @property {String} no_link - (Mutator)
   * @property {String} sheets_url - (Mutator)
   * @property {String} time_zone - (Mutator)
   */
  return {
    createMessage: createEmailMessage,
    send: sendEmail,
    //
    set templates (val) { templates = val },
    set html_body (val) { html_body = val },
    set text_body (val) { text_body = val },
    set email_type (val) { email_type = val },
    set first_name (val) { first_name = val.split(" ").slice(0, -1).join(" ") }, 
    set email (val) { email = val }, 
    set team_name (val) { team_name = val }, 
    set game_date (val) { game_date = Utilities.formatDate(new Date(val), time_zone, "EEEE, MMMM dd") }, 
    set game_time (val) { game_time = Utilities.formatDate(new Date(val), time_zone, "h:mm a") }, 
    set game_opp (val) { game_opp = val }, 
    set yes_link (val) { yes_link = val }, 
    set probably_link (val) { probably_link = val }, 
    set doubtful_link (val) { doubtful_link = val }, 
    set no_link (val) { no_link = val }, 
    set sheets_url (val) { sheets_url = val },
    set time_zone (val) { time_zone = val }
  }
}