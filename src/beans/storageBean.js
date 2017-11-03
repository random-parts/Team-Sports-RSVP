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
 * @overview Handles the google apps script Script&DocumentProperties
 * @license Apache License, Version 2.0
 * @property {storage.PublicInterface} - available public methods
 */

/**
 * ** Storage Bean Object  **
 *
 * @namespace storage
 * @property {storage.PublicInterface} - available public methods
 */
function storage (prop) {
  var storage = prop || Config.storage();
  var key;
  var property = {
    email: "LOG_EMAIL",
    version: "SCRIPT_VERSION"
  }

  /**
   * ---
   * Deletes the storage property by its key.
   *
   * @memberof! storage#
   * @param {String} key - the property key to clear
   */
  function clearStorageProperty (key) {
    storage.deleteProperty(property[key]);
  }

  /**
   * ---
   * Gets and parses Log storage values;
   *
   * @memberof! storage#
   * @param {Object[]} key - property key to retrieve
   */
  function getLog (key) {
    return JSON.parse(storage.getProperty(property[key]));
  }

  /**
   * ---
   * Gets and parses simple storage values;
   *
   * @memberof! storage#
   * @param {Object[]} key - property key to retrieve
   * @returns {?}
   */
  function getSimple (key) {
    return JSON.parse(storage.getProperty(property[key]));
  }

  /**
   * ---
   * Sets Log storage values; concats objects if its not empty
   *
   * @memberof! storage#
   * @param {Object[]} key - property key to use
   * @param {Object[]} log - list of objects to add to the log_email property
   */
  function setLog (key, log) {
    var current_log = getLog(key);
    var log = log;

    if (current_log && log) {
      storage.setProperty(property[key], JSON.stringify(current_log.concat(log)));
    } else if (log) {
      storage.setProperty(property[key], JSON.stringify(log));
    }
  }

  /**
   * ---
   * Sets simple storage values;
   *
   * @memberof! storage#
   * @param {Object[]} key - property key to use
   * @param {?} value - property value
   */
  function setSimple (key, value) {
    storage.setProperty(property[key], JSON.stringify(value));
  }

 /**
   * @typedef {storage} storage.PublicInterface
   * @property {Funtion} clearStorageProperty - [storage().clear()]{@link storage#clearStorageProperty}
   * @property {Funtion} getSimple - [storage().get()]{@link storage#getSimple}
   * @property {Funtion} setSimple - [storage().set()]{@link storage#setSimple}
   * @property {Funtion} getLog - [storage().log.get()]{@link storage#getLog}
   * @property {Funtion} setLog - [storage().log.set()]{@link storage#setLog}
   */  return {
    clear: clearStorageProperty,
    get: getSimple,
    set: setSimple,
    log: {
      get: getLog,
      set: setLog
    }
  }
}
