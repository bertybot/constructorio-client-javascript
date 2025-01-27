/* eslint-disable object-curly-newline, no-underscore-dangle, camelcase, no-unneeded-ternary */
const EventEmitter = require('events');
const helpers = require('../utils/helpers');
const RequestQueue = require('../utils/request-queue');

function applyParams(parameters, options) {
  const {
    apiKey,
    version,
    sessionId,
    clientId,
    userId,
    segments,
    testCells,
    requestMethod,
    beaconMode,
  } = options;
  const { host, pathname } = helpers.getWindowLocation();
  const sendReferrerWithTrackingEvents = (options.sendReferrerWithTrackingEvents === false)
    ? false
    : true; // Defaults to 'true'
  let aggregateParams = Object.assign(parameters);

  if (version) {
    aggregateParams.c = version;
  }

  if (clientId) {
    aggregateParams.i = clientId;
  }

  if (sessionId) {
    aggregateParams.s = sessionId;
  }

  if (userId) {
    aggregateParams.ui = String(userId);
  }

  if (segments && segments.length) {
    aggregateParams.us = segments;
  }

  if (apiKey) {
    aggregateParams.key = apiKey;
  }

  if (testCells) {
    Object.keys(testCells).forEach((testCellKey) => {
      aggregateParams[`ef-${testCellKey}`] = testCells[testCellKey];
    });
  }

  if (beaconMode && requestMethod && requestMethod.match(/POST/i)) {
    aggregateParams.beacon = true;
  }

  if (sendReferrerWithTrackingEvents && host) {
    aggregateParams.origin_referrer = host;

    if (pathname) {
      aggregateParams.origin_referrer += pathname;
    }
  }

  aggregateParams._dt = Date.now();
  aggregateParams = helpers.cleanParams(aggregateParams);

  return aggregateParams;
}

// Append common parameters to supplied parameters object and return as string
function applyParamsAsString(parameters, options) {
  return helpers.stringify(applyParams(parameters, options));
}

/**
 * Interface to tracking related API calls
 *
 * @module tracker
 * @inner
 * @returns {object}
 */
class Tracker {
  constructor(options) {
    this.options = options || {};
    this.eventemitter = new EventEmitter();
    this.requests = new RequestQueue(options, this.eventemitter);
    this.behavioralV2Url = 'https://ac.cnstrc.com/v2/behavioral_action/';
  }

  /**
   * Send session start event to API
   * @private
   * @function trackSessionStartV2
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @example
   * constructorio.tracker.trackSessionStartV2();
   */
  trackSessionStartV2(networkParameters = {}) {
    const url = `${this.behavioralV2Url}session_start?`;

    this.requests.queue(`${url}${applyParamsAsString({}, this.options)}`, 'POST', undefined, networkParameters);
    this.requests.send();

    return true;
  }

  /**
   * Send session start event to API
   *
   * @function trackSessionStart
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @example
   * constructorio.tracker.trackSessionStart();
   */
  trackSessionStart(networkParameters = {}) {
    const url = `${this.options.serviceUrl}/behavior?`;
    const queryParams = { action: 'session_start' };

    this.requests.queue(`${url}${applyParamsAsString(queryParams, this.options)}`, undefined, undefined, networkParameters);
    this.requests.send();

    return true;
  }

  /**
   * Send input focus event to API
   * @private
   * @function trackInputFocusV2
   * @param {string} user_input - Input at the time user focused on the search bar
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User focused on search input element
   * @example
   * constructorio.tracker.trackInputFocusV2("text");
   */
  trackInputFocusV2(user_input = '', networkParameters = {}) {
    const baseUrl = `${this.behavioralV2Url}focus?`;
    const bodyParams = {};
    let networkParametersNew = networkParameters;
    let userInputNew = user_input;

    if (typeof user_input === 'object') {
      networkParametersNew = user_input;
      userInputNew = '';
    }

    bodyParams.user_input = userInputNew;

    const requestMethod = 'POST';
    const requestBody = applyParams(bodyParams, {
      ...this.options,
      requestMethod,
    });
    this.requests.queue(`${baseUrl}${applyParamsAsString({}, this.options)}`, requestMethod, requestBody, networkParametersNew);
    this.requests.send();

    return true;
  }

  /**
   * Send input focus event to API
   *
   * @function trackInputFocus
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User focused on search input element
   * @example
   * constructorio.tracker.trackInputFocus();
   */
  trackInputFocus(networkParameters = {}) {
    const url = `${this.options.serviceUrl}/behavior?`;
    const queryParams = { action: 'focus' };

    this.requests.queue(`${url}${applyParamsAsString(queryParams, this.options)}`, undefined, undefined, networkParameters);
    this.requests.send();

    return true;
  }

  /**
   * Send item detail load event to API
   *
   * @function trackItemDetailLoad
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.item_name - Product item name
   * @param {string} parameters.item_id - Product item unique identifier
   * @param {string} parameters.url - Current page URL
   * @param {string} [parameters.variation_id] - Product item variation unique identifier
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User loaded an item detail page
   * @example
   * constructorio.tracker.trackItemDetailLoad(
   *     {
   *         item_name: 'Red T-Shirt',
   *         item_id: 'KMH876',
   *         url: 'https://constructor.io/product/KMH876',
   *     },
   * );
   */
  trackItemDetailLoad(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const requestUrlPath = `${this.options.serviceUrl}/v2/behavioral_action/item_detail_load?`;
      const queryParams = {};
      const bodyParams = {};
      const {
        item_name,
        name,
        item_id,
        customer_id,
        variation_id,
        url,
      } = parameters;

      // Ensure support for both item_name and name as parameters
      if (item_name) {
        bodyParams.item_name = item_name;
      } else if (name) {
        bodyParams.item_name = name;
      }

      // Ensure support for both item_id and customer_id as parameters
      if (item_id) {
        bodyParams.item_id = item_id;
      } else if (customer_id) {
        bodyParams.item_id = customer_id;
      }

      if (variation_id) {
        bodyParams.variation_id = variation_id;
      }

      if (url) {
        bodyParams.url = url;
      }

      const requestURL = `${requestUrlPath}${applyParamsAsString(queryParams, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(requestURL, requestMethod, requestBody, networkParameters);
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send autocomplete select event to API
   * @private
   * @function trackAutocompleteSelectV2
   * @param {string} item_name - Name of selected autocomplete item
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.user_input - The current autocomplete search query
   * @param {string} [parameters.section] - Section the selected item resides within
   * @param {string} [parameters.tr] - Trigger used to select the item (click, etc.)
   * @param {string} [parameters.item_id] - Item id of the selected item
   * @param {string} [parameters.variation_id] - Variation id of the selected item
   * @param {string} [parameters.group_id] - Group identifier of selected item
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User selected (clicked, or navigated to via keyboard) a result that appeared within autocomplete
   * @example
   * constructorio.tracker.trackAutocompleteSelectV2(
   *     'T-Shirt',
   *      {
   *          user_input: 'Shirt',
   *          section: 'Products',
   *          tr: 'click',
   *          group_id: '88JU230',
   *          item_id: '12345',
   *          variation_id: '12345-A',
   *      },
   * );
   */
  trackAutocompleteSelectV2(item_name, parameters, networkParameters = {}) {
    // Ensure term is provided (required)
    if (item_name && typeof item_name === 'string') {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const baseUrl = `${this.behavioralV2Url}autocomplete_select?`;
        const {
          original_query,
          user_input = original_query,
          original_section,
          section = original_section,
          tr,
          group_id,
          item_id,
          variation_id,
        } = parameters;
        const queryParams = {};
        const bodyParams = {
          user_input,
          tr,
          group_id,
          item_id,
          variation_id,
          item_name,
          section,
        };

        if (section) {
          queryParams.section = section;
        }

        const requestURL = `${baseUrl}${applyParamsAsString(queryParams, this.options)}`;
        const requestMethod = 'POST';
        const requestBody = applyParams(bodyParams, {
          ...this.options,
          requestMethod,
        });
        this.requests.queue(
          requestURL,
          requestMethod,
          requestBody,
          networkParameters,
        );
        this.requests.send();

        return true;
      }

      this.requests.send();

      return new Error('parameters are required of type object');
    }

    this.requests.send();

    return new Error('term is a required parameter of type string');
  }

  /**
   * Send autocomplete select event to API
   *
   * @function trackAutocompleteSelect
   * @param {string} term - Term of selected autocomplete item
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.original_query - The current autocomplete search query
   * @param {string} parameters.section - Section the selected item resides within
   * @param {string} [parameters.tr] - Trigger used to select the item (click, etc.)
   * @param {string} [parameters.group_id] - Group identifier of selected item
   * @param {string} [parameters.display_name] - Display name of group of selected item
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User selected (clicked, or navigated to via keyboard) a result that appeared within autocomplete
   * @example
   * constructorio.tracker.trackAutocompleteSelect(
   *     'T-Shirt',
   *      {
   *          original_query: 'Shirt',
   *          section: 'Products',
   *          tr: 'click',
   *          group_id: '88JU230',
   *          display_name: 'apparel',
   *      },
   * );
   */
  trackAutocompleteSelect(term, parameters, networkParameters = {}) {
    // Ensure term is provided (required)
    if (term && typeof term === 'string') {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const url = `${this.options.serviceUrl}/autocomplete/${helpers.encodeURIComponentRFC3986(helpers.trimNonBreakingSpaces(term))}/select?`;
        const queryParams = {};
        const {
          original_query,
          section,
          original_section,
          tr,
          group_id,
          display_name,
        } = parameters;

        if (original_query) {
          queryParams.original_query = original_query;
        }

        if (tr) {
          queryParams.tr = tr;
        }

        if (original_section || section) {
          queryParams.section = original_section || section;
        }

        if (group_id) {
          queryParams.group = {
            group_id,
            display_name,
          };
        }

        this.requests.queue(`${url}${applyParamsAsString(queryParams, this.options)}`, undefined, undefined, networkParameters);
        this.requests.send();

        return true;
      }

      this.requests.send();

      return new Error('parameters are required of type object');
    }

    this.requests.send();

    return new Error('term is a required parameter of type string');
  }

  /**
   * Send autocomplete search event to API
   * @private
   * @function trackSearchSubmitV2
   * @param {string} search_term - Term of submitted autocomplete event
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.user_input - The current autocomplete search query
   * @param {string} [parameters.group_id] - Group identifier of selected item
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User submitted a search (pressing enter within input element, or clicking submit element)
   * @example
   * constructorio.tracker.trackSearchSubmitV2(
   *     'T-Shirt',
   *     {
   *         user_input: 'Shirt',
   *         group_id: '88JU230',
   *     },
   * );
   */
  trackSearchSubmitV2(search_term, parameters, networkParameters = {}) {
    // Ensure term is provided (required)
    if (search_term && typeof search_term === 'string') {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const baseUrl = `${this.behavioralV2Url}search_submit?`;
        const {
          original_query,
          user_input = original_query,
          group_id,
          section,
        } = parameters;
        const queryParams = {};
        const bodyParams = {
          user_input,
          search_term,
          section,
        };

        if (group_id) {
          bodyParams.filters = { group_id };
        }

        if (section) {
          queryParams.section = section;
        }

        const requestURL = `${baseUrl}${applyParamsAsString(queryParams, this.options)}`;
        const requestMethod = 'POST';
        const requestBody = applyParams(bodyParams, {
          ...this.options,
          requestMethod,
        });
        this.requests.queue(
          requestURL,
          requestMethod,
          requestBody,
          networkParameters,
        );
        this.requests.send();
        return true;
      }

      this.requests.send();

      return new Error('parameters are required of type object');
    }

    this.requests.send();

    return new Error('term is a required parameter of type string');
  }

  /**
   * Send autocomplete search event to API
   *
   * @function trackSearchSubmit
   * @param {string} term - Term of submitted autocomplete event
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.original_query - The current autocomplete search query
   * @param {string} [parameters.group_id] - Group identifier of selected item
   * @param {string} [parameters.display_name] - Display name of group of selected item
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User submitted a search (pressing enter within input element, or clicking submit element)
   * @example
   * constructorio.tracker.trackSearchSubmit(
   *     'T-Shirt',
   *     {
   *         original_query: 'Shirt',
   *         group_id: '88JU230',
   *         display_name: 'apparel',
   *     },
   * );
   */
  trackSearchSubmit(term, parameters, networkParameters = {}) {
    // Ensure term is provided (required)
    if (term && typeof term === 'string') {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const url = `${this.options.serviceUrl}/autocomplete/${helpers.encodeURIComponentRFC3986(helpers.trimNonBreakingSpaces(term))}/search?`;
        const queryParams = {};
        const { original_query, group_id, display_name } = parameters;

        if (original_query) {
          queryParams.original_query = original_query;
        }

        if (group_id) {
          queryParams.group = {
            group_id,
            display_name,
          };
        }

        this.requests.queue(`${url}${applyParamsAsString(queryParams, this.options)}`, undefined, undefined, networkParameters);
        this.requests.send();

        return true;
      }

      this.requests.send();

      return new Error('parameters are required of type object');
    }

    this.requests.send();

    return new Error('term is a required parameter of type string');
  }

  /**
   * Send search results loaded v2 event to API
   * @private
   * @function trackSearchResultsLoadedV2
   * @param {string} search_term - Search results query term
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.url - URL of the search results page
   * @param {number} [parameters.result_count] - Total number of results
   * @param {number} [parameters.result_page] - Current page of search results
   * @param {string} [parameters.result_id] - Browse result identifier (returned in response from Constructor)
   * @param {object} [parameters.selected_filters] - Selected filters
   * @param {string} [parameters.sort_order] - Sort order ('ascending' or 'descending')
   * @param {string} [parameters.sort_by] - Sorting method
   * @param {object[]} [parameters.items] - List of product item unique identifiers in search results listing
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User viewed a search product listing page
   * @example
   * constructorio.tracker.trackSearchResultsLoadedV2(
   *     'T-Shirt',
   *     {
   *         result_count: 167,
   *         items: [{item_id: 'KMH876'}, {item_id: 'KMH140'}, {item_id: 'KMH437'}],
   *         sort_order: 'ascending'
   *         sort_by: 'price',
   *         result_page: 3,
   *         result_count: 20
   *     },
   * );
   */
  trackSearchResultsLoadedV2(search_term, parameters, networkParameters = {}) {
    // Ensure term is provided (required)
    if (search_term && typeof search_term === 'string') {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const baseUrl = `${this.behavioralV2Url}search_result_load?`;
        const {
          num_results,
          result_count = num_results,
          customer_ids,
          item_ids,
          items = customer_ids || item_ids,
          result_page,
          result_id,
          sort_order,
          sort_by,
          selected_filters,
          url,
          section,
        } = parameters;
        const queryParams = {};
        let transformedItems;

        if (items && Array.isArray(items) && items.length !== 0) {
          transformedItems = items;
          if (typeof items[0] === 'string' || typeof items[0] === 'number') {
            transformedItems = items.map((itemId) => ({ item_id: String(itemId) }));
          }
        }

        if (section) {
          queryParams.section = section;
        }

        const bodyParams = {
          search_term,
          result_count,
          items: transformedItems,
          result_page,
          result_id,
          sort_order,
          sort_by,
          selected_filters,
          url,
          section,
        };

        const requestURL = `${baseUrl}${applyParamsAsString(queryParams, this.options)}`;
        const requestMethod = 'POST';
        const requestBody = applyParams(bodyParams, {
          ...this.options,
          requestMethod,
        });
        this.requests.queue(
          requestURL,
          requestMethod,
          requestBody,
          networkParameters,
        );
        this.requests.send();
        return true;
      }

      this.requests.send();

      return new Error('parameters are required of type object');
    }

    this.requests.send();

    return new Error('term is a required parameter of type string');
  }

  /**
   * Send search results loaded event to API
   *
   * @function trackSearchResultsLoaded
   * @param {string} term - Search results query term
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {number} parameters.num_results - Total number of results
   * @param {string[]} [parameters.item_ids] - List of product item unique identifiers in search results listing
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User viewed a search product listing page
   * @example
   * constructorio.tracker.trackSearchResultsLoaded(
   *     'T-Shirt',
   *     {
   *         num_results: 167,
   *         item_ids: ['KMH876', 'KMH140', 'KMH437'],
   *     },
   * );
   */
  trackSearchResultsLoaded(term, parameters, networkParameters = {}) {
    // Ensure term is provided (required)
    if (term && typeof term === 'string') {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const url = `${this.options.serviceUrl}/behavior?`;
        const queryParams = { action: 'search-results', term };
        const { num_results, customer_ids, item_ids } = parameters;
        let customerIDs;

        if (!helpers.isNil(num_results)) {
          queryParams.num_results = num_results;
        }

        // Ensure support for both item_ids and customer_ids as parameters
        if (item_ids && Array.isArray(item_ids) && item_ids.length) {
          customerIDs = item_ids;
        } else if (customer_ids && Array.isArray(customer_ids) && customer_ids.length) {
          customerIDs = customer_ids;
        }

        if (customerIDs && customerIDs.length) {
          queryParams.customer_ids = customerIDs.slice(0, 100).join(',');
        }

        this.requests.queue(`${url}${applyParamsAsString(queryParams, this.options)}`, undefined, undefined, networkParameters);
        this.requests.send();

        return true;
      }

      this.requests.send();

      return new Error('parameters are required of type object');
    }

    this.requests.send();

    return new Error('term is a required parameter of type string');
  }

  /**
   * Send click through event to API
   * @private
   * @function trackSearchResultClickV2
   * @param {string} term - Search results query term
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.item_name - Product item name (Either item_name or item_id is required)
   * @param {string} parameters.item_id - Product item unique identifier
   * @param {string} [parameters.variation_id] - Product item variation unique identifier
   * @param {string} [parameters.result_id] - Search result identifier (returned in response from Constructor)
   * @param {number} [parameters.result_count] - Number of results in total
   * @param {number} [parameters.result_page] - Current page of results
   * @param {string} [parameters.result_position_on_page] - Position of selected items on page
   * @param {string} [parameters.num_results_per_page] - Number of results per page
   * @param {object} [parameters.selected_filters] - Key - Value map of selected filters
   * @param {string} [parameters.section] - The section name for the item Ex. "Products"
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User clicked a result that appeared within a search product listing page
   * @example
   * constructorio.tracker.trackSearchResultClickV2(
   *     'T-Shirt',
   *     {
   *         item_name: 'Red T-Shirt',
   *         item_id: 'KMH876',
   *         result_id: '019927c2-f955-4020-8b8d-6b21b93cb5a2',
   *     },
   * );
   */
  trackSearchResultClickV2(term, parameters, networkParameters = {}) {
    // Ensure term is provided (required)
    if (term && typeof term === 'string') {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const baseUrl = `${this.behavioralV2Url}search_result_click?`;
        const {
          customer_id,
          item_id = customer_id,
          name,
          item_name = name,
          variation_id,
          result_id,
          result_count,
          result_page,
          result_position_on_page,
          num_results_per_page,
          selected_filters,
          section,
        } = parameters;
        const bodyParams = {
          item_name,
          item_id,
          variation_id,
          result_id,
          result_count,
          result_page,
          result_position_on_page,
          num_results_per_page,
          selected_filters,
          section,
          search_term: term,
        };
        const queryParams = {};

        if (section) {
          queryParams.section = section;
        }

        const requestURL = `${baseUrl}${applyParamsAsString(queryParams, this.options)}`;
        const requestMethod = 'POST';
        const requestBody = applyParams(bodyParams, {
          ...this.options,
          requestMethod,
        });
        this.requests.queue(
          requestURL,
          requestMethod,
          requestBody,
          networkParameters,
        );
        this.requests.send();
        return true;
      }

      this.requests.send();

      return new Error('parameters are required of type object');
    }

    this.requests.send();

    return new Error('term is a required parameter of type string');
  }

  /**
   * Send click through event to API
   *
   * @function trackSearchResultClick
   * @param {string} term - Search results query term
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.item_name - Product item name
   * @param {string} parameters.item_id - Product item unique identifier
   * @param {string} [parameters.variation_id] - Product item variation unique identifier
   * @param {string} [parameters.result_id] - Search result identifier (returned in response from Constructor)
   * @param {string} [parameters.item_is_convertible] - Whether or not an item is available for a conversion
   * @param {string} [parameters.section] - The section name for the item Ex. "Products"
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User clicked a result that appeared within a search product listing page
   * @example
   * constructorio.tracker.trackSearchResultClick(
   *     'T-Shirt',
   *     {
   *         item_name: 'Red T-Shirt',
   *         item_id: 'KMH876',
   *         result_id: '019927c2-f955-4020-8b8d-6b21b93cb5a2',
   *     },
   * );
   */
  trackSearchResultClick(term, parameters, networkParameters = {}) {
    // Ensure term is provided (required)
    if (term && typeof term === 'string') {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const url = `${this.options.serviceUrl}/autocomplete/${helpers.encodeURIComponentRFC3986(helpers.trimNonBreakingSpaces(term))}/click_through?`;
        const queryParams = {};
        const {
          item_name,
          name,
          item_id,
          customer_id,
          variation_id,
          result_id,
          section,
          item_is_convertible,
        } = parameters;

        // Ensure support for both item_name and name as parameters
        if (item_name) {
          queryParams.name = item_name;
        } else if (name) {
          queryParams.name = name;
        }

        // Ensure support for both item_id and customer_id as parameters
        if (item_id) {
          queryParams.customer_id = item_id;
        } else if (customer_id) {
          queryParams.customer_id = customer_id;
        }

        if (variation_id) {
          queryParams.variation_id = variation_id;
        }

        if (result_id) {
          queryParams.result_id = result_id;
        }

        if (typeof item_is_convertible === 'boolean') {
          queryParams.item_is_convertible = item_is_convertible;
        }

        if (section) {
          queryParams.section = section;
        }

        this.requests.queue(`${url}${applyParamsAsString(queryParams, this.options)}`, undefined, undefined, networkParameters);
        this.requests.send();

        return true;
      }

      this.requests.send();

      return new Error('parameters are required of type object');
    }

    this.requests.send();

    return new Error('term is a required parameter of type string');
  }

  /**
   * Send conversion event to API
   *
   * @function trackConversion
   * @param {string} [term] - Search results query term that led to conversion event
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.item_id - Product item unique identifier
   * @param {number} [parameters.revenue] - Sale price if available, otherwise the regular (retail) price of item
   * @param {string} [parameters.item_name] - Product item name
   * @param {string} [parameters.variation_id] - Product item variation unique identifier
   * @param {string} [parameters.type='add_to_cart'] - Conversion type
   * @param {boolean} [parameters.is_custom_type] - Specify if type is custom conversion type
   * @param {string} [parameters.display_name] - Display name for the custom conversion type
   * @param {string} [parameters.result_id] - Result identifier (returned in response from Constructor)
   * @param {string} [parameters.section="Products"] - Index section
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User performed an action indicating interest in an item (add to cart, add to wishlist, etc.)
   * @see https://docs.constructor.io/rest_api/behavioral_logging/conversions
   * @example
   * constructorio.tracker.trackConversion(
   *     'T-Shirt',
   *     {
   *         item_id: 'KMH876',
   *         revenue: 12.00,
   *         item_name: 'Red T-Shirt',
   *         variation_id: 'KMH879-7632',
   *         type: 'like',
   *         result_id: '019927c2-f955-4020-8b8d-6b21b93cb5a2',
   *         section: 'Products',
   *     },
   * );
   */
  trackConversion(term, parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const searchTerm = term || 'TERM_UNKNOWN';
      const requestPath = `${this.options.serviceUrl}/v2/behavioral_action/conversion?`;
      const queryParams = {};
      const bodyParams = {};
      const {
        name,
        item_name,
        item_id,
        customer_id,
        variation_id,
        revenue,
        section = 'Products',
        display_name,
        type,
        is_custom_type,
      } = parameters;

      // Ensure support for both item_id and customer_id as parameters
      if (item_id) {
        bodyParams.item_id = item_id;
      } else if (customer_id) {
        bodyParams.item_id = customer_id;
      }

      // Ensure support for both item_name and name as parameters
      if (item_name) {
        bodyParams.item_name = item_name;
      } else if (name) {
        bodyParams.item_name = name;
      }

      if (variation_id) {
        bodyParams.variation_id = variation_id;
      }

      if (revenue) {
        bodyParams.revenue = revenue.toString();
      }

      if (section) {
        queryParams.section = section;
        bodyParams.section = section;
      }

      if (searchTerm) {
        bodyParams.search_term = searchTerm;
      }

      if (type) {
        bodyParams.type = type;
      }

      if (is_custom_type) {
        bodyParams.is_custom_type = is_custom_type;
      }

      if (display_name) {
        bodyParams.display_name = display_name;
      }

      const requestURL = `${requestPath}${applyParamsAsString(queryParams, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send purchase event to API
   *
   * @function trackPurchase
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {object[]} parameters.items - List of product item objects
   * @param {number} parameters.revenue - The subtotal (not including taxes, shipping, etc.) of the entire order
   * @param {string} [parameters.order_id] - Unique order identifier
   * @param {string} [parameters.section="Products"] - Index section
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User completed an order (usually fired on order confirmation page)
   * @example
   * constructorio.tracker.trackPurchase(
   *     {
   *         items: [{ item_id: 'KMH876' }, { item_id: 'KMH140' }],
   *         revenue: 12.00,
   *         order_id: 'OUNXBG2HMA',
   *         section: 'Products',
   *     },
   * );
   */
  trackPurchase(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const requestPath = `${this.options.serviceUrl}/v2/behavioral_action/purchase?`;
      const queryParams = {};
      const bodyParams = {};
      const { items, revenue, order_id, section } = parameters;

      if (order_id) {
        // Don't send another purchase event if we have already tracked the order
        if (helpers.hasOrderIdRecord(order_id)) {
          return false;
        }

        helpers.addOrderIdRecord(order_id);

        // Add order_id to the tracking params
        bodyParams.order_id = order_id;
      }

      if (items && Array.isArray(items)) {
        bodyParams.items = items.slice(0, 100);
      }

      if (revenue) {
        bodyParams.revenue = revenue;
      }

      if (section) {
        queryParams.section = section;
      } else {
        queryParams.section = 'Products';
      }

      const requestURL = `${requestPath}${applyParamsAsString(queryParams, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send recommendation view event to API
   *
   * @function trackRecommendationView
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.url - Current page URL
   * @param {string} parameters.pod_id - Pod identifier
   * @param {number} parameters.num_results_viewed - Number of results viewed
   * @param {object[]} [parameters.items] - List of Product Item Objects
   * @param {number} [parameters.result_count] - Total number of results
   * @param {number} [parameters.result_page] - Page number of results
   * @param {string} [parameters.result_id] - Recommendation result identifier (returned in response from Constructor)
   * @param {string} [parameters.section="Products"] - Results section
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User viewed a set of recommendations
   * @example
   * constructorio.tracker.trackRecommendationView(
   *     {
   *         items: [{ item_id: 'KMH876' }, { item_id: 'KMH140' }],
   *         result_count: 22,
   *         result_page: 2,
   *         result_id: '019927c2-f955-4020-8b8d-6b21b93cb5a2',
   *         url: 'https://demo.constructor.io/sandbox/farmstand',
   *         pod_id: '019927c2-f955-4020',
   *         num_results_viewed: 3,
   *     },
   * );
   */
  trackRecommendationView(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const requestPath = `${this.options.serviceUrl}/v2/behavioral_action/recommendation_result_view?`;
      const bodyParams = {};
      const {
        result_count,
        result_page,
        result_id,
        section,
        url,
        pod_id,
        num_results_viewed,
        items,
      } = parameters;

      if (!helpers.isNil(result_count)) {
        bodyParams.result_count = result_count;
      }

      if (!helpers.isNil(result_page)) {
        bodyParams.result_page = result_page;
      }

      if (result_id) {
        bodyParams.result_id = result_id;
      }

      if (section) {
        bodyParams.section = section;
      } else {
        bodyParams.section = 'Products';
      }

      if (url) {
        bodyParams.url = url;
      }

      if (pod_id) {
        bodyParams.pod_id = pod_id;
      }

      if (!helpers.isNil(num_results_viewed)) {
        bodyParams.num_results_viewed = num_results_viewed;
      }

      if (items && Array.isArray(items)) {
        bodyParams.items = items.slice(0, 100);
      }

      const requestURL = `${requestPath}${applyParamsAsString({}, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send recommendation click event to API
   *
   * @function trackRecommendationClick
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.pod_id - Pod identifier
   * @param {string} parameters.strategy_id - Strategy identifier
   * @param {string} parameters.item_id - Product item unique identifier
   * @param {string} parameters.item_name - Product name
   * @param {string} [parameters.variation_id] - Product item variation unique identifier
   * @param {string} [parameters.section="Products"] - Index section
   * @param {string} [parameters.result_id] - Recommendation result identifier (returned in response from Constructor)
   * @param {number} [parameters.result_count] - Total number of results
   * @param {number} [parameters.result_page] - Page number of results
   * @param {number} [parameters.result_position_on_page] - Position of result on page
   * @param {number} [parameters.num_results_per_page] - Number of results on page
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User clicked an item that appeared within a list of recommended results
   * @example
   * constructorio.tracker.trackRecommendationClick(
   *     {
   *         variation_id: 'KMH879-7632',
   *         result_id: '019927c2-f955-4020-8b8d-6b21b93cb5a2',
   *         result_count: 22,
   *         result_page: 2,
   *         result_position_on_page: 2,
   *         num_results_per_page: 12,
   *         pod_id: '019927c2-f955-4020',
   *         strategy_id: 'complimentary',
   *         item_name: 'Socks',
   *         item_id: 'KMH876',
   *     },
   * );
   */
  trackRecommendationClick(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const requestPath = `${this.options.serviceUrl}/v2/behavioral_action/recommendation_result_click?`;
      const bodyParams = {};
      const {
        variation_id,
        section,
        result_id,
        result_count,
        result_page,
        result_position_on_page,
        num_results_per_page,
        pod_id,
        strategy_id,
        item_id,
        item_name,
      } = parameters;

      if (variation_id) {
        bodyParams.variation_id = variation_id;
      }

      if (section) {
        bodyParams.section = section;
      } else {
        bodyParams.section = 'Products';
      }

      if (result_id) {
        bodyParams.result_id = result_id;
      }

      if (!helpers.isNil(result_count)) {
        bodyParams.result_count = result_count;
      }

      if (!helpers.isNil(result_page)) {
        bodyParams.result_page = result_page;
      }

      if (!helpers.isNil(result_position_on_page)) {
        bodyParams.result_position_on_page = result_position_on_page;
      }

      if (!helpers.isNil(num_results_per_page)) {
        bodyParams.num_results_per_page = num_results_per_page;
      }

      if (pod_id) {
        bodyParams.pod_id = pod_id;
      }

      if (strategy_id) {
        bodyParams.strategy_id = strategy_id;
      }

      if (item_id) {
        bodyParams.item_id = item_id;
      }

      if (item_name) {
        bodyParams.item_name = item_name;
      }

      const requestURL = `${requestPath}${applyParamsAsString({}, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send browse results loaded event to API
   *
   * @function trackBrowseResultsLoaded
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.url - Current page URL
   * @param {string} parameters.filter_name - Filter name
   * @param {string} parameters.filter_value - Filter value
   * @param {string} [parameters.section="Products"] - Index section
   * @param {number} [parameters.result_count] - Total number of results
   * @param {number} [parameters.result_page] - Page number of results
   * @param {string} [parameters.result_id] - Browse result identifier (returned in response from Constructor)
   * @param {object} [parameters.selected_filters] - Selected filters
   * @param {string} [parameters.sort_order] - Sort order ('ascending' or 'descending')
   * @param {string} [parameters.sort_by] - Sorting method
   * @param {object[]} [parameters.items] - List of product item objects
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User viewed a browse product listing page
   * @example
   * constructorio.tracker.trackBrowseResultsLoaded(
   *     {
   *         result_count: 22,
   *         result_page: 2,
   *         result_id: '019927c2-f955-4020-8b8d-6b21b93cb5a2',
   *         selected_filters: { brand: ['foo'], color: ['black'] },
   *         sort_order: 'ascending',
   *         sort_by: 'price',
   *         items: [{ item_id: 'KMH876' }, { item_id: 'KMH140' }],
   *         url: 'https://demo.constructor.io/sandbox/farmstand',
   *         filter_name: 'brand',
   *         filter_value: 'XYZ',
   *     },
   * );
   */
  trackBrowseResultsLoaded(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const requestPath = `${this.options.serviceUrl}/v2/behavioral_action/browse_result_load?`;
      const bodyParams = {};
      const {
        section,
        result_count,
        result_page,
        result_id,
        selected_filters,
        url,
        sort_order,
        sort_by,
        filter_name,
        filter_value,
        items,
      } = parameters;

      if (section) {
        bodyParams.section = section;
      } else {
        bodyParams.section = 'Products';
      }

      if (!helpers.isNil(result_count)) {
        bodyParams.result_count = result_count;
      }

      if (!helpers.isNil(result_page)) {
        bodyParams.result_page = result_page;
      }

      if (result_id) {
        bodyParams.result_id = result_id;
      }

      if (selected_filters) {
        bodyParams.selected_filters = selected_filters;
      }

      if (url) {
        bodyParams.url = url;
      }

      if (sort_order) {
        bodyParams.sort_order = sort_order;
      }

      if (sort_by) {
        bodyParams.sort_by = sort_by;
      }

      if (filter_name) {
        bodyParams.filter_name = filter_name;
      }

      if (filter_value) {
        bodyParams.filter_value = filter_value;
      }

      if (items && Array.isArray(items)) {
        bodyParams.items = items.slice(0, 100);
      }

      const requestURL = `${requestPath}${applyParamsAsString({}, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send browse result click event to API
   *
   * @function trackBrowseResultClick
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.filter_name - Filter name
   * @param {string} parameters.filter_value - Filter value
   * @param {string} parameters.item_id - Product item unique identifier
   * @param {string} parameters.item_name - Product item name
   * @param {string} [parameters.section="Products"] - Index section
   * @param {string} [parameters.variation_id] - Product item variation unique identifier
   * @param {string} [parameters.result_id] - Browse result identifier (returned in response from Constructor)
   * @param {number} [parameters.result_count] - Total number of results
   * @param {number} [parameters.result_page] - Page number of results
   * @param {number} [parameters.result_position_on_page] - Position of clicked item
   * @param {number} [parameters.num_results_per_page] - Number of results shown
   * @param {object} [parameters.selected_filters] - Selected filters
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User clicked a result that appeared within a browse product listing page
   * @example
   * constructorio.tracker.trackBrowseResultClick(
   *     {
   *         variation_id: 'KMH879-7632',
   *         result_id: '019927c2-f955-4020-8b8d-6b21b93cb5a2',
   *         result_count: 22,
   *         result_page: 2,
   *         result_position_on_page: 2,
   *         num_results_per_page: 12,
   *         selected_filters: { brand: ['foo'], color: ['black'] },
   *         filter_name: 'brand',
   *         filter_value: 'XYZ',
   *         item_id: 'KMH876',
   *     },
   * );
   */
  trackBrowseResultClick(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const requestPath = `${this.options.serviceUrl}/v2/behavioral_action/browse_result_click?`;
      const bodyParams = {};
      const {
        section,
        variation_id,
        result_id,
        result_count,
        result_page,
        result_position_on_page,
        num_results_per_page,
        selected_filters,
        filter_name,
        filter_value,
        item_id,
        customer_id,
        item_name,
        name,
      } = parameters;

      if (section) {
        bodyParams.section = section;
      } else {
        bodyParams.section = 'Products';
      }

      if (variation_id) {
        bodyParams.variation_id = variation_id;
      }

      if (result_id) {
        bodyParams.result_id = result_id;
      }

      if (!helpers.isNil(result_count)) {
        bodyParams.result_count = result_count;
      }

      if (!helpers.isNil(result_page)) {
        bodyParams.result_page = result_page;
      }

      if (!helpers.isNil(result_position_on_page)) {
        bodyParams.result_position_on_page = result_position_on_page;
      }

      if (!helpers.isNil(num_results_per_page)) {
        bodyParams.num_results_per_page = num_results_per_page;
      }

      if (selected_filters) {
        bodyParams.selected_filters = selected_filters;
      }

      if (filter_name) {
        bodyParams.filter_name = filter_name;
      }

      if (filter_value) {
        bodyParams.filter_value = filter_value;
      }

      // Ensure support for both item_id and customer_id as parameters
      if (item_id) {
        bodyParams.item_id = item_id;
      } else if (customer_id) {
        bodyParams.item_id = customer_id;
      }

      // Ensure support for both item_name and name as parameters
      if (item_name) {
        bodyParams.item_name = item_name;
      } else if (name) {
        bodyParams.item_name = name;
      }

      const requestURL = `${requestPath}${applyParamsAsString({}, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send generic result click event to API
   *
   * @function trackGenericResultClick
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.item_id - Product item unique identifier
   * @param {string} [parameters.item_name] - Product item name
   * @param {string} [parameters.variation_id] - Product item variation unique identifier
   * @param {string} [parameters.section="Products"] - Index section
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User clicked a result that appeared outside of the scope of search / browse / recommendations
   * @example
   * constructorio.tracker.trackGenericResultClick(
   *     {
   *         item_id: 'KMH876',
   *         item_name: 'Red T-Shirt',
   *         variation_id: 'KMH879-7632',
   *     },
   * );
   */
  trackGenericResultClick(parameters, networkParameters = {}) {
    // Ensure required parameters are provided
    if (typeof parameters === 'object' && !!parameters.item_id) {
      const requestPath = `${this.options.serviceUrl}/v2/behavioral_action/result_click?`;
      const bodyParams = {};
      const {
        item_id,
        item_name,
        variation_id,
        section,
      } = parameters;

      bodyParams.section = section || 'Products';
      bodyParams.item_id = item_id;

      if (item_name) {
        bodyParams.item_name = item_name;
      }

      if (variation_id) {
        bodyParams.variation_id = variation_id;
      }

      const requestURL = `${requestPath}${applyParamsAsString({}, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('A parameters object with an "item_id" property is required.');
  }

  /**
   * Send quiz results loaded event to API
   *
   * @function trackQuizResultsLoaded
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.quiz_id - Quiz identifier
   * @param {string} parameters.quiz_version_id - Quiz version identifier
   * @param {string} parameters.quiz_session_id - Quiz session identifier associated with this conversion event
   * @param {string} parameters.url - Current page url
   * @param {string} [parameters.section='Products'] - Index section
   * @param {number} [parameters.result_count] - Total number of results
   * @param {number} [parameters.result_page] - The page of the results
   * @param {string} [parameters.result_id] - Quiz result identifier (returned in response from Constructor)
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User viewed a quiz results page
   * @example
   * constructorio.tracker.trackQuizResultsLoaded(
   *     {
   *         quiz_id: 'coffee-quiz',
   *         quiz_version_id: '1231244',
   *         quiz_session_id: '3123',
   *         url: 'www.example.com',
   *         result_count: 167,
   *     },
   * );
   */
  trackQuizResultsLoaded(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const requestPath = `${this.options.serviceUrl}/v2/behavioral_action/quiz_result_load?`;
      const {
        quiz_id,
        quiz_version_id,
        quiz_session_id,
        url,
        section = 'Products',
        result_count,
        result_id,
        result_page,
      } = parameters;
      const queryParams = {};
      const bodyParams = {};

      if (typeof quiz_id !== 'string') {
        return new Error('"quiz_id" is a required parameter of type string');
      }

      if (typeof quiz_version_id !== 'string') {
        return new Error('"quiz_version_id" is a required parameter of type string');
      }

      if (typeof quiz_session_id !== 'string') {
        return new Error('"quiz_session_id" is a required parameter of type string');
      }

      if (typeof url !== 'string') {
        return new Error('"url" is a required parameter of type string');
      }

      bodyParams.quiz_id = quiz_id;
      bodyParams.quiz_version_id = quiz_version_id;
      bodyParams.quiz_session_id = quiz_session_id;
      bodyParams.url = url;

      if (!helpers.isNil(section)) {
        if (typeof section !== 'string') {
          return new Error('"section" must be a string');
        }
        queryParams.section = section;
        bodyParams.section = section;
      }

      if (!helpers.isNil(result_count)) {
        if (typeof result_count !== 'number') {
          return new Error('"result_count" must be a number');
        }
        bodyParams.result_count = result_count;
      }

      if (!helpers.isNil(result_id)) {
        if (typeof result_id !== 'string') {
          return new Error('"result_id" must be a string');
        }
        bodyParams.result_id = result_id;
      }

      if (!helpers.isNil(result_page)) {
        if (typeof result_page !== 'number') {
          return new Error('"result_page" must be a number');
        }
        bodyParams.result_page = result_page;
      }

      bodyParams.action_class = 'result_load';

      const requestURL = `${requestPath}${applyParamsAsString(queryParams, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send quiz result click event to API
   *
   * @function trackQuizResultClick
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.quiz_id - Quiz identifier
   * @param {string} parameters.quiz_version_id - Quiz version identifier
   * @param {string} parameters.quiz_session_id - Quiz session identifier associated with this conversion event
   * @param {string} [parameters.item_id] - Product item unique identifier (Either item_id or item_name is required)
   * @param {string} [parameters.item_name] - Product item name
   * @param {string} [parameters.section='Products'] - Index section
   * @param {number} [parameters.result_count] - Total number of results
   * @param {number} [parameters.result_page] - The page of the results
   * @param {string} [parameters.result_id] - Quiz result identifier (returned in response from Constructor)
   * @param {number} [parameters.result_position_on_page] - Position of clicked item
   * @param {number} [parameters.num_results_per_page] - Number of results shown
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User viewed a quiz results page
   * @example
   * constructorio.tracker.trackQuizResultClick(
   *     {
   *         quiz_id: 'coffee-quiz',
   *         quiz_version_id: '1231244',
   *         quiz_session_id: '123',
   *         item_id: '123',
   *         item_name: 'espresso'
   *     },
   * );
   */
  // eslint-disable-next-line complexity
  trackQuizResultClick(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const requestPath = `${this.options.serviceUrl}/v2/behavioral_action/quiz_result_click?`;
      const {
        quiz_id,
        quiz_version_id,
        quiz_session_id,
        item_id,
        item_name,
        result_count,
        result_id,
        result_page,
        num_results_per_page,
        result_position_on_page,
        section = 'Products',
      } = parameters;

      const queryParams = {};
      const bodyParams = {};

      // Ensure required parameters provided
      if (typeof quiz_id !== 'string') {
        return new Error('"quiz_id" is a required parameter of type string');
      }

      if (typeof quiz_version_id !== 'string') {
        return new Error('"quiz_version_id" is a required parameter of type string');
      }

      if (typeof quiz_session_id !== 'string') {
        return new Error('"quiz_session_id" is a required parameter of type string');
      }

      if (typeof item_id !== 'string' && typeof item_name !== 'string') {
        return new Error('"item_id" or "item_name" is a required parameter of type string');
      }

      bodyParams.quiz_id = quiz_id;
      bodyParams.quiz_version_id = quiz_version_id;
      bodyParams.quiz_session_id = quiz_session_id;

      if (!helpers.isNil(item_id)) {
        if (typeof item_id !== 'string') {
          return new Error('"item_id" must be a string');
        }
        bodyParams.item_id = item_id;
      }

      if (!helpers.isNil(item_name)) {
        if (typeof item_name !== 'string') {
          return new Error('"item_name" must be a string');
        }
        bodyParams.item_name = item_name;
      }

      if (!helpers.isNil(section)) {
        if (typeof section !== 'string') {
          return new Error('"section" must be a string');
        }
        queryParams.section = section;
      }

      if (!helpers.isNil(result_count)) {
        if (typeof result_count !== 'number') {
          return new Error('"result_count" must be a number');
        }
        bodyParams.result_count = result_count;
      }

      if (!helpers.isNil(result_id)) {
        if (typeof result_id !== 'string') {
          return new Error('"result_id" must be a string');
        }
        bodyParams.result_id = result_id;
      }

      if (!helpers.isNil(result_page)) {
        if (typeof result_page !== 'number') {
          return new Error('"result_page" must be a number');
        }
        bodyParams.result_page = result_page;
      }

      if (!helpers.isNil(num_results_per_page)) {
        if (typeof num_results_per_page !== 'number') {
          return new Error('"num_results_per_page" must be a number');
        }
        bodyParams.num_results_per_page = num_results_per_page;
      }

      if (!helpers.isNil(result_position_on_page)) {
        if (typeof result_position_on_page !== 'number') {
          return new Error('"result_position_on_page" must be a number');
        }
        bodyParams.result_position_on_page = result_position_on_page;
      }

      bodyParams.action_class = 'result_click';

      const requestURL = `${requestPath}${applyParamsAsString(queryParams, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send quiz conversion event to API
   *
   * @function trackQuizConversion
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.quiz_id - Quiz identifier
   * @param {string} parameters.quiz_version_id - Quiz version identifier
   * @param {string} parameters.quiz_session_id - Quiz session identifier associated with this conversion event
   * @param {string} [parameters.item_id] - Product item unique identifier (Either item_id or item_name is required)
   * @param {string} [parameters.item_name] - Product item name
   * @param {string} [parameters.variation_id] - Product item variation unique identifier
   * @param {string} [parameters.revenue] - Sale price if available, otherwise the regular (retail) price of item
   * @param {string} [parameters.section='Products'] - Index section
   * @param {string} [parameters.type='add_to_cart'] - Conversion type
   * @param {boolean} [parameters.is_custom_type] - Specify if type is custom conversion type
   * @param {string} [parameters.display_name] - Display name for the custom conversion type
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User viewed a quiz results page
   * @example
   * constructorio.tracker.trackQuizConversion(
   *     {
   *         quiz_id: 'coffee-quiz',
   *         quiz_version_id: '1231244',
   *         quiz_session_id: '3123',
   *         item_name: 'espresso',
   *         variation_id: '167',
   *         type: 'add_to_cart",
   *         revenue: '1.0"
   *     },
   * );
   */
  // eslint-disable-next-line complexity
  trackQuizConversion(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const requestPath = `${this.options.serviceUrl}/v2/behavioral_action/quiz_conversion?`;
      const {
        quiz_id,
        quiz_version_id,
        quiz_session_id,
        item_id,
        item_name,
        variation_id,
        revenue,
        section = 'Products',
        type,
        is_custom_type,
        display_name,
      } = parameters;

      const queryParams = {};
      const bodyParams = {};

      // Ensure required parameters provided
      if (typeof quiz_id !== 'string') {
        return new Error('"quiz_id" is a required parameter of type string');
      }

      if (typeof quiz_version_id !== 'string') {
        return new Error('"quiz_version_id" is a required parameter of type string');
      }

      if (typeof quiz_session_id !== 'string') {
        return new Error('"quiz_session_id" is a required parameter of type string');
      }

      if (typeof item_id !== 'string' && typeof item_name !== 'string') {
        return new Error('"item_id" or "item_name" is a required parameter of type string');
      }

      bodyParams.quiz_id = quiz_id;
      bodyParams.quiz_version_id = quiz_version_id;
      bodyParams.quiz_session_id = quiz_session_id;

      if (!helpers.isNil(item_id)) {
        if (typeof item_id !== 'string') {
          return new Error('"item_id" must be a string');
        }
        bodyParams.item_id = item_id;
      }

      if (!helpers.isNil(item_name)) {
        if (typeof item_name !== 'string') {
          return new Error('"item_name" must be a string');
        }
        bodyParams.item_name = item_name;
      }

      if (!helpers.isNil(variation_id)) {
        if (typeof variation_id !== 'string') {
          return new Error('"variation_id" must be a string');
        }
        bodyParams.variation_id = variation_id;
      }

      if (!helpers.isNil(revenue)) {
        if (typeof revenue !== 'string') {
          return new Error('"revenue" must be a string');
        }
        bodyParams.revenue = revenue;
      }

      if (!helpers.isNil(section)) {
        if (typeof section !== 'string') {
          return new Error('"section" must be a string');
        }
        bodyParams.section = section;
      }

      if (!helpers.isNil(type)) {
        if (typeof type !== 'string') {
          return new Error('"type" must be a string');
        }
        bodyParams.type = type;
      }

      if (!helpers.isNil(is_custom_type)) {
        if (typeof is_custom_type !== 'boolean') {
          return new Error('"is_custom_type" must be a boolean');
        }
        bodyParams.is_custom_type = is_custom_type;
      }

      if (!helpers.isNil(display_name)) {
        if (typeof display_name !== 'string') {
          return new Error('"display_name" must be a string');
        }
        bodyParams.display_name = display_name;
      }

      bodyParams.action_class = 'conversion';

      const requestURL = `${requestPath}${applyParamsAsString(queryParams, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Subscribe to success or error messages emitted by tracking requests
   *
   * @function on
   * @param {string} messageType - Type of message to listen for ('success' or 'error')
   * @param {function} callback - Callback to be invoked when message received
   * @returns {(true|Error)}
   * @example
   * constructorio.tracker.on('error', (data) => {
   *     // Handle tracking error
   * });
   */
  on(messageType, callback) {
    if (messageType !== 'success' && messageType !== 'error') {
      return new Error('messageType must be a string of value "success" or "error"');
    }

    if (!callback || typeof callback !== 'function') {
      return new Error('callback is required and must be a function');
    }

    this.eventemitter.on(messageType, callback);

    return true;
  }
}

// Exposed for testing
Tracker.RequestQueue = RequestQueue;

module.exports = Tracker;
