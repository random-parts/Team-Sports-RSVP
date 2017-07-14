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
 * @overview Gets and Sets script properties default & custom settings.
 * @license Apache License, Version 2.0
 * @property {settings.PublicInterface} - available public methods
 */

/**
 * ** Settings Bean Object **
 *
 * @namespace settings
 * @property {settings.PublicInterface} - available public methods
 * @param {Spreadsheet} spreadsheet - a spreadsheet object
 */
function settings () {
  var storage = (function () { 
    if (Config.debug) { return PropertiesService.getScriptProperties() }
     else { return PropertiesService.getDocumentProperties() }
  })();
  var daysBeforeGame, import_table, separator, template_name, template_prefix;
 
  /**
   * ---
   * Deletes all of the document or script properties.
   *
   * @memberof! settings#
   */
  function clearStorageProperties () {
    storage.deleteAllProperties();
  }

  /**
   * ---
   * Splits String Property values into a list.
   *
   * @param {String} prop
   * @param {String} optional separator
   * @return {String|Array}
   */
  function _strToArray (stored_property, separator) {
    var separator = separator || ",";
    return stored_property.split(separator);
  }
  
  /**
   * ---
   * Splits property values containing a string of comma separated 
   * numbers into a list.
   *
   * @param {NumberString} stored_property
   * @return {Number|Array}
   */ 
  function _numToArray (stored_property) {
    try { return JSON.parse("[" + stored_property + "]") }
     catch (e) { return null }
  }
  
  /**
   * ---
   * Returns all of the stored properties.
   */
  function _getSetting () {
    return storage.getProperties()
  }
  
  /**
   * @typedef {settings} settings.PublicInterface
   * @property {Funtion} clearStorageProperties [settings().clearAll()]{@link settings#clearStorageProperties}
   * @property {List(",")} email.daysBeforeGame - (Accessor|Mutator)
   *          - Days left until gameday to send emails @default [1, 3]
   * @property {Number} sheet.import_table - (Accessor|Mutator)
   *          - the weblink schedule's table number @default [11]
   * @property {String} sheet.template_name - (Accessor)
   *          - the template name @default "_template"
   * @property {String} sheet.template_prefix - (Accessor)
   *          - the template prefix for named ranges @default "_t_"
   */
  return {
    clearAll: clearStorageProperties,
    //
    email: {
      get daysBeforeGame () { return Number(_numToArray(_getSetting["EMAIL_DAYS"])) || [1, 3] },
      set daysBeforeGame (val) { storage.setProperty("EMAIL_DAYS", val) }
    },
    sheet: {
      get import_table () { return _getSetting["IMPORT_TABLE"] || 11 },
      set import_table (val) { storage.setProperty("IMPORT_TABLE", val) },
      get template_name () { return (typeof template_name == "undefined") ? "_template" : template_name },
      get template_prefix () { return (typeof template_prefix == "undefined") ? "_t_" : template_prefix }  
    }
  }
}