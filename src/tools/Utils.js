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
 * @overview A home for the odds and ends that other objects dont want.
 * @license Apache License, Version 2.0
 * @property {utils.PublicInterface} - available public methods
 */

/**
 * ** Utilities Object **
 * 
 * @namespace utils
 * @property {utils.PublicInterface} - available public methods
 */
function utils (spreadsheet, tz) {
  var spreadsheet;
  var ss = spreadsheet || Config.spreadsheet();
  var tz = tz || ss.getSpreadsheetTimeZone();

  /**
   * ---
   * Get the most common occurrence and count of an element in an array.
   * Also, check if it is the [2/3rd] majority of occurrences.
   *
   * @memberof! utils#
   * @param {Array} arr - the array to check
   * @return {Array}
   * ```
   * [0][i] most common elements
   * [1] count
   * [2] is_majority
   * ```
   */
  function getMostCommon (arr) {
    var arr = arr || [];
    var high_count;
      // Return if only one value
      if (!arr.length) { return [[arr], 1] }

    // Reduce the elements into key:value object
    var count = arr.reduce(function (r, k) {
      r[k] ? r[k]++ : r[k] = 1;
      return r;
    }, {});

    // Return the key(s) with the highest occurrence
    var common = Object.keys(count).reduce(function (r, k, i) {
      if (!i || count[k] > count[r[0]]) {
        high_count = count[k];
        return [(parseInt(k) || k)];
      }
      // Add additional keys equal to highest occurrence
      if (count[k] === count[r[0]]) { r.push((parseInt(k) || k)) }
      return r;
    }, []);

    // Check if most common element is also 2/3rd majority
    var is_majority = (arr.length >= 3)
      ? (Math.floor(.67 * arr.length) <= high_count)
      : false;

    return [common, high_count, is_majority];
  }

/*******************************************************************************
*                                utils().date                                  *
*******************************************************************************/

  /**
   * ---
   * Formats date objects into strings or numbers
   *
   * @memberof! utils#
   * @param {String=} - the format type
   * @param {Array|Date=} - the date object or array of date objects to format
   * @return {Number[]|String[][]}
   */
  function formatDateTime () {
    var a = arguments.length
      ? (typeof arguments[1] != 'undefined'
        ? (arguments[1].length ? arguments[1] : [arguments[1]]) : [new Date()])
      : [new Date()];
    var df = {
      logs: "dd-MMM-yy 'at' h:mm:s a",
      short: "EEE MMM d",
      split: ["EEEE, MMMM dd","h:mm a"],
      yearday: "D"
    };

    var format = a.map(function (e) {
      switch (true) {
        // Log email timestamp
        case this == "logs":
          return Utilities.formatDate(new Date(e), tz, df.logs);
          break;

        // Format into short display [Dayname shortMonth daynum]
        case this == "short":
          return Utilities.formatDate(new Date(e), tz, df.short);
          break;

         // Format and splits into [date, time]
        case this == "split":
          return [Utilities.formatDate(new Date(e), tz, df.split[0]),
                  Utilities.formatDate(new Date(e), tz, df.split[1])];
          break;

        // Day number of the week: `1 = Monday...7 =Sunday`
        case this == "weekday":
          return e.getDay();
          break;

        // Day number of the year
        case this == "yearday":
          return Number(Utilities.formatDate(new Date(e), tz, df.yearday));
          break;

        // Current datetime
        default:
          return new Date(e);
      }
    }, arguments[0]);

    return format;
  }

  /**
   * ---
   * Combines date and time to create string date with time.
   *
   * @memberof! utils#
   * @param {String} date - string month and day
   * @param {String} time - string time
   * @return {String} _"MMM dd h:mm a"_
   */
  function rawDateTime (date, time) {
    if (typeof date != "undefined") {
      var clean_date = date.replace(/-/, " ");
      
      return clean_date + " " + time;
    }
  }

/*******************************************************************************
*                                utils().form                                  *
*******************************************************************************/
  
  /**
   * ---
   * Fetches and returns a super-duper fun and inspiring quote.
   *
   * @memberof! utils#
   * @cache - 1.5 hours to prevent exceeding hourly quota
   * @return {Struct} 
   * ```
   * {
   *  "author": author, 
   *   "quote": quote, 
   *  "source": source
   * }
   * ```
   */
  function fetchQuoteOfTheDay () {
    var cache = (function () { 
      if (Config.debug) { return CacheService.getScriptCache() }
     else { return CacheService.getDocumentCache() }
    })();
    
    if (!cache.get("author") || !cache.get("quote")) {
      var form_msg = UrlFetchApp.fetch("http://quotes.rest/qod?category=inspire");
      var json = JSON.parse(form_msg);
      var quote = json.contents.quotes[0].quote;
      var author = json.contents.quotes[0].author;
      cache.put("quote", quote, 5400);
      cache.put("author", author, 5400);
    } 
     var author = cache.get("author");
     var quote = cache.get("quote");
     var source = '\n\n\n[powered by quotes from theysaidso.com]';
     var message = {
       "author": author,
       "quote": quote,  
       "source": source
     };

    return message;
  }
  
/*******************************************************************************
*                               utils().script                                 *
*******************************************************************************/
  
  /**
   * ---
   * Installs the triggers for the spreadsheet.
   *
   *  |  Trigger     |   |
   *  |--------------|---|
   *  | onFormSubmit | [onFormSubmit]{@link onFormSubmit}
   *  | onEdit       | [onSheetEdit]{@link onSheetEdit}
   *  | Time-Based   | [onTimeTrigger]{@link onDailyTrigger} (6am sheet timezone)
   *
   * @memberof! utils#
   */
  function addTriggers () {
    // Clear previously installed script triggers before re-installing them
    clearTriggers();

    ScriptApp.newTrigger("onFormSubmit")
             .forSpreadsheet(ss)
             .onFormSubmit()
             .create();
    ScriptApp.newTrigger("onSheetEdit")
             .forSpreadsheet(ss)
             .onEdit()
             .create();
    ScriptApp.newTrigger("onDailyTrigger")
             .timeBased()
             .atHour(6)
             .everyDays(1)
             .inTimezone(tz)
             .create();
  }

  /**
   * ---
   * Checks for major or minor updates that may require
   * script property/setting updates. Runs the update
   * and sets the new version in storage.
   *
   * @memberof! utils#
   */
  function checkUpdateVersion () {
    var current_ver = parseFloat(storage().get("version")) || "0.0";

    // Check for major or minor version changes
    if (current_ver < parseFloat(Config.version)) {
      try {
        // Run updates
        _updateScript();

        SpreadsheetApp.flush();
        // Set the new version in storage
        storage().set("version", Config.version);
      } catch (e) {}
    }
  }

  /**
   * --- 
   * Delete the spreadsheets installed triggers.
   *
   * @memberof! utils#
   */
  function clearTriggers () {
     var installed = ScriptApp.getUserTriggers(ss);
     
     if (installed.length != 0) {
       installed.forEach(function (e) { ScriptApp.deleteTrigger(e) });
     }
  }

  /**
   * ---
   * Updates the script when major or minor script changes require it
   *
   * @memberof! utils#
   */
  function _updateScript () {
    // Updates for 1.3 - update NamedRanges
    sheetService().update.namedRanges();

    // Apply pending Spreadsheet changes
    SpreadsheetApp.flush();
  }

  /**
   * ---
   * Invokes a function, performing up to 5 retries with exponential backoff.
   * Retries with delays of approximately 1, 2, 4, 8 then 16 seconds for a total of 
   * about 32 seconds before it gives up and rethrows the last error. 
   * See: https://developers.google.com/google-apps/documents-list/#implementing_exponential_backoff 
   * <br>Author: peter.herrmann@gmail.com (Peter Herrmann)
   <h3>Examples:</h3>
   <pre>//Calls an anonymous function that concatenates a greeting with the current Apps user's email
   var example1 = GASRetry.call(function(){return "Hello, " + Session.getActiveUser().getEmail();});
   </pre><pre>//Calls an existing function
   var example2 = GASRetry.call(myFunction);
   </pre><pre>//Calls an anonymous function that calls an existing function with an argument
   var example3 = GASRetry.call(function(){myFunction("something")});
   </pre><pre>//Calls an anonymous function that invokes DocsList.setTrashed on myFile and logs retries with the Logger.log function.
   var example4 = GASRetry.call(function(){myFile.setTrashed(true)}, Logger.log);
   </pre>
   *
   * @memberof! utils#
   * @param {Function} func The anonymous or named function to call.
   * @param {Function} optLoggerFunction Optionally, you can pass a function that will be used to log 
   to in the case of a retry. For example, Logger.log (no parentheses) will work.
   * @return {*} The value returned by the called function.
   */
  function gasRetry (func, optLoggerFunction) {
    for (var n = 0; n < 6; n++) {
      try {
        return func();
      } catch (e) {
        if (optLoggerFunction) { optLoggerFunction("GASRetry " + n + ": " + e); }
        if (n == 5) {
          throw e;
        } 
        Utilities.sleep((Math.pow(2,n)*1000) + (Math.round(Math.random() * 1000)));
      }     
    }
  }
  
  /**
   * @typedef {utils} utils.PublicInterface
   * @property {Function} getMostCommon - [utils().getMostCommon()]{@link utils#getMostCommon}
   * @property {Function} formatDateTime - [utils().date.format()]{@link utils#formatDateTime}
   * @property {Function} rawDateTime - [utils().date.makeDateTime()]{@link utils#rawDateTime}
   * @property {Function} fetchQuoteOfTheDay - [utils().form.fetchQuote()]{@link utils#fetchQuoteOfTheDay}
   * @property {Function} clearTriggers - [utils().script.clean.triggers()]{@link utils#clearTriggers}
   * @property {Function} addTriggers - [utils().script.install.triggers()]{@link utils#addTriggers}
   * @property {Function} gasRetry - [utils().script.retry()]{@link utils#gasRetry}
   * @property {Function} checkUpdateVersion - [utils().script.update()]{@link utils#checkUpdateVersion}
   */
  return {
    getMostCommon: getMostCommon,
    date: {
      format: formatDateTime,
      makeDateTime: rawDateTime
    },
    form: {
      fetchQuote: fetchQuoteOfTheDay
    },
    script: {
      clean: {
        triggers: clearTriggers
      },
      install: {
        triggers: addTriggers
      },
      retry: gasRetry,
      update: checkUpdateVersion
    }
  }
}
