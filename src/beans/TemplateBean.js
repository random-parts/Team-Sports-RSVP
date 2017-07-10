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
 * @overview Creates, gets and sets the default template's formats and properties.
 * @license Apache License, Version 2.0
 * @property {template.PublicInterface} - available public methods
 */

/**
 * ** Template Sheet Bean Object **
 *
 * @namespace template
 * @property {template.PublicInterface} - available public methods
 * @param {Spreadsheet} spreadsheet - a spreadsheet object
 */
function template (spreadsheet) {
  var index, options, prefix, spreadsheet, template_name, template_sheet;
  var ss = spreadsheet || Config.spreadsheet();
  //var template_sheet = ss.getSheetByName(template_name) || template_sheet;
    

  /**
   * ---
   * Template sheet creation.
   * 
   * @memberof! template#
   */
  function createTemplate () {
    ss.insertSheet(template_name, index);
  }
  
  /**
   * ---
   * Removes named ranges that are only used for the default Template sheet.
   * 
   * @memberof! template#
   * @this sheet
   */
  function deleteNamedRanges () {
    this.named_ranges = template_sheet.getNamedRanges();
    
    this.removeNamedRanges()
  }
  
  /**
   * ---
   * Default Formatting for the Template sheet.
   * 
   * @memberof! template#
   */
  function formatTemplate () {
    var format_nameblock = ss.getRangeByName(prefix + "teamBlock");
    var format_block = ss.getRangeByName(prefix + "blankBlock");
    var format_squad = ss.getRangeByName(prefix + "squad");
    var format_squademail = ss.getRangeByName(prefix + "squadEmail");
    var format_next = ss.getRangeByName(prefix + "nextSeasonRows");
    var format_games = ss.getRangeByName(prefix + "headerColumns");
    var format_rsvp = ss.getRangeByName(prefix + "rsvpRange");
    var format_time = ss.getRangeByName(prefix + "timeColumns");
    var format_header = ss.getRangeByName(prefix + "squadHeader");
    var format_games_rsvp = template_sheet.getRange(format_games.getRow(),
                                        format_games.getColumn(),
                                        format_rsvp.getNumRows(),
                                        format_games.getNumColumns());
      // Format block of cells
      format_block.setBackground("#434343");
      format_block.merge();

      // Format Team Name block
      format_nameblock.setBackground("#434343")
                      .setFontColor("white")
                      .setFontWeight("bold")
                      .setFontSize(20);
      format_nameblock.merge()
                      .setVerticalAlignment("middle");

      // Format game schedule/rsvp grid
      format_games_rsvp.setHorizontalAlignment("center");
      format_games_rsvp.setWrap(true);

      // Format game time
      format_time.setNumberFormat('h":"mm" "am/pm');

      // Format roster headers
      format_header.setBackground("#434343").setFontColor("white");

      // Format contact list
      format_squad.setBackground("#F4F4F4")
                  .setBorder(null, false, true, true, false, false);

      // Set Squard Column Widths
      template_sheet.setColumnWidth(format_squad.getColumn(), 200);
      template_sheet.setColumnWidth(format_squademail.getLastColumn(), 175);
      template_sheet.setColumnWidth(format_next.getColumn(), 75);
 
      template_sheet.setFrozenColumns(1);
  }

  /**
   * ---
   * Sets the prefix for the template named ranges
   * 
   * @memberof! template#
   * @this sheet
   */
  function setNamedRanges () {
    this.prefix = prefix
    this.sh = template_sheet

    this.updateNamedRanges()
  }
  
  /**
   * ---
   * Populate Template headerRange with header text.
   * 
   * @memberof! template#
   * @constant {Array} squad-range headings
   */
  function setTemplateContent () {
    const headers = [["Name", "Email", "Next?", "Paid", "Phone"]];
    var squad_headers = ss.getRangeByName(prefix + "squadHeader");
 
    squad_headers.setValues(headers); 
  }

  /**
   * ---
   * Gets the proper template sheet.
   * 
   * @memberof! template#
   * @returns {SheetObject} the template sheet object
   */ 
  function getTemplateSheet () {
    var template_name = settings().sheet.template_name;
    var template_sheet = template_sheet || ss.getSheetByName(template_name) || null;

    return template_sheet;
  }
  
  /**
   * @typedef {template} template.PublicInterface
   * @property {Function} createTemplate - [template().create()]{@link template#createTemplate}
   * @property {Function} formatTemplate - [template().format()]{@link template#formatTemplate}
   * @property {Function} setTemplateContent - [template().setValues()]{@link template#setTemplateContent}
   * @property {Function} deleteNamedRanges - [template().removeNamedRanges()]{@link template#deleteNamedRanges}
   * @property {Function} setNamedRanges - [template().updateNamedRanges()]{@link template#setNamedRanges}
   * @property {Number} index - (Mutator) sheet position
   * @property {Struct} options - (Mutator) options object for sheet insertion
   * @property {String} prefix - (Mutator) named_range prefix
   * @property {String} template_name - (Mutator) template name
   */
  return {
    create: createTemplate,
    format: formatTemplate,
    setValues: setTemplateContent,
    removeNamedRanges: deleteNamedRanges.bind(sheet(ss)),
    updateNamedRanges: setNamedRanges.bind(sheet(ss)),
    getTemplate: getTemplateSheet,
    //
    set index (val) { index = val },
    set options (val) { options = val },
    set prefix (val) { prefix = val },
    set template_sheet (val) { template_sheet = val },
    set template_name (val) { template_name = val }
  }
}