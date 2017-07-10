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
function utils (spreadsheet) {
  var spreadsheet;
  var ss = spreadsheet || Config.spreadsheet();
  
/*******************************************************************************
*                                utils().date                                  *
*******************************************************************************/

  /**
   * ---
   * Converts a date_time object into it's day number of the year 
   * for date comparison.
   *
   * @memberof! utils#
   * @param {Date} datetime a date object
   * @return {Number}
   */
  function dayOfYear (datetime) {
    var time_zone = ss.getSpreadsheetTimeZone();
  
    return parseInt(Utilities.formatDate(new Date(datetime), time_zone, "D"));
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
             .inTimezone(ss.getSpreadsheetTimeZone())
             .create();
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
   * @property {Function} dayOfYear - [utils().date.asDayOfYear()]{@link utils#dayOfYear}
   * @property {Function} rawDateTime - [utils().date.makeDateTime()]{@link utils#rawDateTime}
   * @property {Function} fetchQuoteOfTheDay - [utils().form.fetchQuote()]{@link utils#fetchQuoteOfTheDay}
   * @property {Function} clearTriggers - [utils().script.clean.triggers()]{@link utils#clearTriggers}
   * @property {Function} addTriggers - [utils().script.install.triggers()]{@link utils#addTriggers}
   * @property {Function} gasRetry - [utils().script.retry()]{@link utils#gasRetry}
   */
  return {
    date: {
      asDayOfYear: dayOfYear,
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
      retry: gasRetry
    }
  }
}