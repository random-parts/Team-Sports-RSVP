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
 * @overview Helps build the JSON request needed to interact with 
 * the Sheets API v4 advanced services.
 *
 * @license Apache License, Version 2.0
 * @property {apiBuilder.PublicInterface} - available public methods
 */

/**
 * ** Advanced Services API Builder **
 *
 * @see [Advanced Sheets Service ]{@link 
 *       https://developers.google.com/apps-script/advanced/sheets}
 * @namespace apiBuilder
 * @property {apiBuilder.PublicInterface} - available public methods
 * @param {Spreadsheet} - a spreadsheet object
 * @param {String} - a spreadsheet id
 */
function apiBuilder (ss, id) {
  const enums = {
      majorDimension: ["ROWS","COLUMNS"],
      valueRenderOption: ["FORMATTED_VALUE","UNFORMATTED_VALUE","FORMULA"],
      dateTimeRenderOption: ["SERIAL_NUMBER","FORMATTED_STRING"],
      valueInputOption: ["RAW", "USER_ENTERED"]
    }
  var ss, id;
  var spreadsheet = ss || null;
  var ss_id = id || null;
  var byColumn, date_render, data_range, dimension, range, render, 
      values, valueInput ,includeValues;

  /** 
   * ---
   * Spreadsheets.Values.get
   *
   * @memberof! apiBuilder#
   * @param {Range=} range - range to get values from
   * @param {Boolean=} byColumn - should get by column or row
   * @return {Array} response.value - [ValueRange]{@link 
   * https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values#ValueRange}
   */
  function getRangeValues (range, byColumn) {
    // Use params if available 
    if (byColumn == true) { this.options.dimension = enums.majorDimension[1] }
    if (typeof range != "undefined") { this.data_range = range }
    
    // Set the range
    var r = this.data_range || ss.getDataRange().getA1Notation();
    // ValueRange Object
    var response = Sheets.Spreadsheets.Values.get(ss_id, r, _options(this.options));
    
    return response.values;
  }
  
  /** 
   * ---
   * Spreadsheets.Values.update
   *
   * @memberof! apiBuilder#
   * @param {Range=} range - range to get values from
   * @param {Boolean=} byColumn - should get by column or row
   * @return {Array} - the [UpdateValuesResponse]{@link 
   * https://developers.google.com/sheets/api/reference/rest/v4/UpdateValuesResponse}
   * ```
   * {
   * "spreadsheetId": string,
   * "updatedRange": string,
   * "updatedRows": number,
   * "updatedColumns": number,
   * "updatedCells": number,
   * "updatedData": {
   * object(ValueRange)
   * },
   * }
   * ```
   */
  function updateRangeValues (range, byColumn) {
    // Use params if available 
    if (byColumn == true) { this.options.dimension = enums.majorDimension[1] }
    if (typeof range != "undefined") { this.data_range = range }
    
    // Set the range
    var r = this.data_range || this.value_range.range || ss.getDataRange().getA1Notation();
    
    var response = Sheets.Spreadsheets.Values.update(_valueRange(this.value_range), ss_id, r, _updOptions(this.update.options))

    // Apply pending Spreadsheet changes
    SpreadsheetApp.flush();

    return response;
  }
  
/******************************************************************************
*                                  @private                                   *
******************************************************************************/
  
  /**
   * ---
   * ValueRange Object Resource/Request.
   *
   * @param {Struct} vr - the value_range property object
   * @return {Struct}
   */
  function _valueRange (vr) {
    var value_range = {}
    value_range.range = vr.range || ss.getDataRange().getA1Notation();
    value_range.majorDimension = vr.dimension || enums.majorDimension[0];
    value_range.values = vr.values || [];
  
  return value_range;
  }
  
  /**
   * ---
   * Options for the GET action.
   *
   * @param {Struct} opts - the options property object
   * @return {Struct}
   */
  function _options (opts) {
    var options = {}
    options.majorDimension = opts.dimension || enums.majorDimension[0];
    options.valueRenderOption = opts.render || enums.valueRenderOption[0];
    options.dateTimeRenderOption = opts.date_render || enums.dateTimeRenderOption[0];

    return options;
  }
  
  /**
   * ---
   * Options for the UPDATE Action.
   *
   * @param {Struct} opts - the update.options property object
   * @return {Struct}
   */
  function _updOptions (opts) {
    var options = {}
    options.valueInputOption = opts.valueInput || enums.valueInputOption[0];
    options.includeValuesInResponse = opts.includeValues || false;
    options.responseValueRenderOption = opts.render || enums.valueRenderOption[0];
    options.responseDateTimeRenderOption = opts.date_render || enums.dateTimeRenderOption[0];

    return options;
  }
  
  /**
   * ---
   * Check that the input val has a matching value with the const Enums object by key
   *
   * @param {*} val - the val to check
   * @param {String} key - the enum object key to match values against
   * @return {Boolean}
   */
  function _isValid(val, key) {  
    return Boolean(enums[key].indexOf(val.toUpperCase()) !== -1);
  }

  /**  
   * @typedef {apiBuilder} apiBuilder.PublicInterface
   * @property {Function} getRangeValues - [apiBuilder().getRangeValues()]{@link 
   *                                        apiBuilder#getRangeValues} 
   * @property {Function} updateRangeValues - [apiBuilder().updateRangeValues()]{@link 
   *                                           apiBuilder#updateRangeValues}
   * @property {Range|String} data_range - Accessor|Mutator
   * @property {Spreadsheet} spreadsheet - Mutator
   * @property {String} ss_id - Mutator
   * @property {String} options.dimension - Accessor|Mutator
   * @property {String} options.render - Accessor|Mutator
   * @property {String} options.date_render - Accessor|Mutator
   * @property {String} update.options.valueInput - Accessor|Mutator
   * @property {Boolean} update.options.includeValues - Accessor|Mutator
   * @property {String} update.options.render - Accessor|Mutator
   * @property {String} update.options.date_render - Accessor|Mutator
   * @property {String} value_range.dimension - Accessor|Mutator
   * @property {Range|String} value_range.range - Accessor|Mutator
   * @property {Array} value_range.values - Accessor|Mutator
   */  
  return {
    getRangeValues: getRangeValues,
    updateRangeValues: updateRangeValues,
    //
    get data_range () { return data_range },
    set spreadsheet (val) { spreadsheet = val },
    set ss_id (val) { ss_id = val },
    set data_range (val) { data_range = (typeof val == "string") ? val : val.getA1Notation() },
    options: {
      get dimension () { return dimension },
      get render () { return render },
      get date_render () { return date_render },
      set dimension (val) { dimension = _isValid(val, "majorDimension") ? val.toUpperCase() : undefined },
      set render (val) { render = _isValid(val, "valueRenderOption") ? val.toUpperCase() : undefined },
      set date_render (val) { date_render = _isValid(val, "dateTimeRenderOption") ? val.toUpperCase() : undefined }
      },
    update: { 
      options: {
        get valueInput () { return valueInput },
        get includeValues () { return includeValues },
        get render () { return render },
        get date_render () { return date_render },
        set valueInput (val) { valueInput = _isValid(val, "valueInputOption") ? val.toUpperCase() : undefined},
        set includeValues (val) { includeValues = Boolean(val) || false},
        set render (val) { render = _isValid(val, "valueRenderOption") ? val.toUpperCase() : undefined },
        set date_render (val) { date_render = _isValid(val, "dateTimeRenderOption") ? val.toUpperCase() : undefined }
      }
    },    
    value_range: {
      get dimension () { return dimension },
      get range () { return range },
      get values () { return values },
      set dimension (val) { dimension = _isValid(val, "majorDimension") ? val.toUpperCase() : undefined },
      set range (val) { range = (typeof val == "string") ? val : val.getA1Notation() },
      set values (val) { values = val }
    }
  }
}