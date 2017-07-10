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
 * @overview Creates, sets and updates the Google Form used for 
 * email notification replies.
 * @license Apache License, Version 2.0
 * @property {form.PublicInterface} - available public methods
 */

/**
 * ** Form Bean Object **
 *
 * @namespace form
 * @property {form.PublicInterface} - available public methods
 */
function form () {
  const rsvp_opts = ["Yes", "Probably", "Doubtful", "No"];
  var team_form, confirmation, destination, destination_type, 
      email_address, game_date, title, name;
  
  /**
   * ---
   * Create the Google Form used for team rsvp replies
   *
   * | array | value kind
   * |---|---
   * | `item[0]` | MultipleChoice ["Yes", "Probably", "Doubtful", "No"] 
   * | `item[1]` | Section Header 
   * | `item[2]` | Text game date/time (prefilled to identify game)
   * | `item[3]` | Text email address (prefilled to identify user)
   * 
   * @memberof! form#
   */
  function createTeamForm () {
    var item = team_form.addMultipleChoiceItem();
    
    // Create form UI
    team_form.setShowLinkToRespondAgain(false);
    team_form.setTitle(name + " game");
    team_form.setDescription("Game RSVP form");
    // Set the form items
    item.setTitle("Will you attend the game?");
    item.setChoices([
      item.createChoice(rsvp_opts[0]),
      item.createChoice(rsvp_opts[1]),
      item.createChoice(rsvp_opts[2]),
      item.createChoice(rsvp_opts[3])]);
    team_form.addSectionHeaderItem().setTitle(
      "Do not change if you want your reply to count.");
    team_form.addTextItem();
    team_form.addTextItem();

    // Attach the form to its destination [spreadsheet]
    team_form.setDestination(destination_type, destination);
  }
  
  /**
   * ---
   * Create a single set of prefilled form options. 
   * Each set contains 4 prefilled links, one for each possiable rsvp_option. 
   * Each form is also set with the squad mates email address and the game date.
   * Also cahnge the URI of the prefilled_url so that the form will auto submit.
   *
   * | array | value kind
   * |---|---
   * | `prefilled_set[0]` | Yes {link}
   * | `prefilled_set[1]` | Probably {link}
   * | `prefilled_set[2]` | Doubtful {link}
   * | `prefilled_set[3]` | No {link}
   * 
   * @memberof! form#
   * @return {Array} a single set of prefilled links
   */
  function getPrefilledLinks () {
    var items = team_form.getItems();
    var form_response = team_form.createResponse();
    var choice_item = items[0].asMultipleChoiceItem();
    var game_item = items[2].asTextItem();
    var email_item = items[3].asTextItem();
    // Set-up form item response
    var game_response = game_item.createResponse(game_date);
    var email_response = email_item.createResponse(email_address);
    var prefilled_set = [];
  
    form_response.withItemResponse(game_response);
    form_response.withItemResponse(email_response);
   
    // Create a link for each of the 4 rsvp options
    rsvp_opts.forEach(function (e) {
      var choice_response = choice_item.createResponse(e);
      form_response.withItemResponse(choice_response);
      
      var prefill_url = form_response.toPrefilledUrl();
      var tiny_url = team_form.shortenFormUrl(prefill_url.replace("/viewform?", 
                                                                  "/formResponse?"));
      // Package each option link into a neat package
      prefilled_set.push(tiny_url);
    });
    
    return prefilled_set;
  }
  
  /**
   * ---
   * Updates the form submission confirmation message.
   * 
   * @memberof! form#
   */
  function updateConfirmation () {
    team_form.setConfirmationMessage(confirmation)
  }
  
  /**
   * @typedef {form} form.PublicInterface
   * @property {Function} createTeamForm [form().create()]{@link form#createTeamForm}
   * @property {Function} updateConfirmationQuote [form().update()]{@link form#updateConfirmationQuote}
   * @property {Function} getPrefilledLinks [form().prefilledLinks()]{@link form#getPrefilledLinks}
   * @property {Array} rsvp_opts - (Accessor) answer options avaiable 
   * @property {String} name - (Accessor|Mutator) form name
   * @property {FormObject} team_form - (Accessor|Mutator)
   * @property {String} confirmation - (Mutator) submission/confirmation message
   * @property {String} destination - (Mutator) spreadsheet id
   * @property {Enum} destination_type - (Mutator) destination type enum
   * @property {String} email_address - (Mutator)
   * @property {Date} game_date - (Mutator)
   * @property {Title} title - (Mutator) change the title
   */
  return {
    create: createTeamForm,
    prefilledLinks: getPrefilledLinks,
    updateMessage: updateConfirmation,
    //
    get rsvp_opts () { return rsvp_opts },
    get name () { return name },
    get team_form (){ return team_form },
    set confirmation (val) { confirmation = val },
    set destination (val) { destination = val },
    set destination_type (val) { destination_type = val },
    set email_address (val) { email_address = val },
    set game_date (val) { game_date = val },
    set name (val) { name = val },
    set team_form (val) { team_form = val },
    set title (val) { team_form.setTitle(val + " game") }
  }
}