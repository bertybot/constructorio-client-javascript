/* eslint-disable object-curly-newline, no-underscore-dangle, camelcase */
const qs = require('qs');
const helpers = require('../utils/helpers');
const RequestQueue = require('../utils/request-queue');

// Append common parameters to supplied parameters object
function applyParams(parameters, options) {
  const { apiKey, version, sessionId, clientId, userId, segments } = options;
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
    aggregateParams.ui = userId;
  }

  if (segments && segments.length) {
    aggregateParams.us = segments;
  }

  if (apiKey) {
    aggregateParams.key = apiKey;
  }

  aggregateParams._dt = Date.now();
  aggregateParams = helpers.cleanParams(aggregateParams);

  return aggregateParams;
}

// Append common parameters to supplied parameters object and return as string
function applyParamsAsString(parameters, options) {
  return qs.stringify(applyParams(parameters, options), { indices: false });
}

/**
 * Interface to tracking related API calls
 *
 * @module Tracker
 * @inner
 * @returns {object}
 */
class Tracker {
  constructor(options) {
    this.options = options;
    this.requests = new RequestQueue(options);
  }

  /**
   * Send session start event to API
   *
   * @function sendSessionStart
   * @returns {(true|Error)}
   */
  sendSessionStart() {
    const url = `${this.options.serviceUrl}/behavior?`;
    const queryParams = { action: 'session_start' };

    this.requests.queue(`${url}${applyParamsAsString(queryParams, this.options)}`);
    this.requests.send();

    return true;
  }

  /**
   * Send input focus event to API
   *
   * @function sendInputFocus
   * @returns {(true|Error)}
   */
  sendInputFocus() {
    const url = `${this.options.serviceUrl}/behavior?`;
    const queryParams = { action: 'focus' };

    this.requests.queue(`${url}${applyParamsAsString(queryParams, this.options)}`);
    this.requests.send();

    return true;
  }

  /**
   * Send autocomplete select event to API
   *
   * @function trackAutocompleteSelect
   * @param {string} term - Term of selected autocomplete item
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.original_query - The current autocomplete search query
   * @param {string} parameters.result_id - Customer id of the selected autocomplete item
   * @param {string} parameters.section - Section the selected item resides within
   * @param {string} [parameters.tr] - Trigger used to select the item (click, etc.)
   * @param {string} [parameters.group_id] - Group identifier of selected item
   * @param {string} [parameters.display_name] - Display name of group of selected item
   * @returns {(true|Error)}
   */
  trackAutocompleteSelect(term, parameters) {
    // Ensure term is provided (required)
    if (term && typeof term === 'string') {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const url = `${this.options.serviceUrl}/autocomplete/${helpers.ourEncodeURIComponent(term)}/select?`;
        const queryParams = {};
        const {
          original_query,
          result_id,
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

        if (result_id) {
          queryParams.result_id = result_id;
        }

        this.requests.queue(`${url}${applyParamsAsString(queryParams, this.options)}`);
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
   * @param {string} parameters.result_id - Customer ID of the selected autocomplete item
   * @param {string} [parameters.group_id] - Group identifier of selected item
   * @param {string} [parameters.display_name] - Display name of group of selected item
   * @returns {(true|Error)}
   */
  trackSearchSubmit(term, parameters) {
    // Ensure term is provided (required)
    if (term && typeof term === 'string') {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const url = `${this.options.serviceUrl}/autocomplete/${helpers.ourEncodeURIComponent(term)}/search?`;
        const queryParams = {};
        const { original_query, result_id, group_id, display_name } = parameters;

        if (original_query) {
          queryParams.original_query = original_query;
        }

        if (group_id) {
          queryParams.group = {
            group_id,
            display_name,
          };
        }

        if (result_id) {
          queryParams.result_id = result_id;
        }

        this.requests.queue(`${url}${applyParamsAsString(queryParams, this.options)}`);
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
   * Send search results event to API
   *
   * @function trackSearchResultsLoaded
   * @param {string} term - Search results query term
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {number} parameters.num_results - Number of search results in total
   * @param {array} [parameters.customer_ids] - List of customer item id's returned from search
   * @returns {(true|Error)}
   */
  trackSearchResultsLoaded(term, parameters) {
    // Ensure term is provided (required)
    if (term && typeof term === 'string') {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const url = `${this.options.serviceUrl}/behavior?`;
        const queryParams = { action: 'search-results', term };
        const { num_results, customer_ids } = parameters;

        if (num_results) {
          queryParams.num_results = num_results;
        }

        if (customer_ids && Array.isArray(customer_ids)) {
          queryParams.customer_ids = customer_ids.join(',');
        }

        this.requests.queue(`${url}${applyParamsAsString(queryParams, this.options)}`);
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
   * @param {string} parameters.name - Identifier
   * @param {string} parameters.customer_id - Customer id
   * @param {string} parameters.result_id - Result id
   * @returns {(true|Error)}
   */
  trackSearchResultClick(term, parameters) {
    // Ensure term is provided (required)
    if (term && typeof term === 'string') {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const url = `${this.options.serviceUrl}/autocomplete/${helpers.ourEncodeURIComponent(term)}/click_through?`;
        const queryParams = {};
        const { name, customer_id, result_id } = parameters;

        if (name) {
          queryParams.name = name;
        }

        if (customer_id) {
          queryParams.customer_id = customer_id;
        }

        if (result_id) {
          queryParams.result_id = result_id;
        }

        this.requests.queue(`${url}${applyParamsAsString(queryParams, this.options)}`);
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
   * @param {string} term - Search results query term
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.name - Identifier
   * @param {string} parameters.customer_id - Customer id
   * @param {string} parameters.result_id - Result id
   * @param {string} parameters.revenue - Revenue
   * @param {string} parameters.section - Autocomplete section
   * @returns {(true|Error)}
   */
  trackConversion(term, parameters) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const searchTerm = helpers.ourEncodeURIComponent(term) || 'TERM_UNKNOWN';
      const url = `${this.options.serviceUrl}/autocomplete/${searchTerm}/conversion?`;
      const queryParams = {};
      const { name, customer_id, result_id, revenue, section } = parameters;

      if (name) {
        queryParams.name = name;
      }

      if (customer_id) {
        queryParams.customer_id = customer_id;
      }

      if (result_id) {
        queryParams.result_id = result_id;
      }

      if (revenue) {
        queryParams.revenue = revenue;
      }

      if (section) {
        queryParams.section = section;
      } else {
        queryParams.section = 'Products';
      }

      this.requests.queue(`${url}${applyParamsAsString(queryParams, this.options)}`);
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
   * @param {array} parameters.customer_ids - List of customer item id's
   * @param {string} parameters.revenue - Revenue
   * @param {string} parameters.section - Autocomplete section
   * @returns {(true|Error)}
   */
  trackPurchase(parameters) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const url = `${this.options.serviceUrl}/autocomplete/TERM_UNKNOWN/purchase?`;
      const queryParams = {};

      const { customer_ids, revenue, section } = parameters;

      if (customer_ids) {
        queryParams.customer_ids = customer_ids;
      }

      if (revenue) {
        queryParams.revenue = revenue;
      }

      if (section) {
        queryParams.section = section;
      } else {
        queryParams.section = 'Products';
      }

      this.requests.queue(`${url}${applyParamsAsString(queryParams, this.options)}`);
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
   * @param {string} parameters.result_id - Result identifier
   * @param {string} parameters.section - Results section (defaults to "Products")
   * @param {string} parameters.pod_id - Pod identifier
   * @param {number} parameters.num_results_viewed - Number of results viewed
   * @returns {(true|Error)}
   */
  trackRecommendationView(parameters) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const url = `${this.options.serviceUrl}/v2/behavior/recommendation_result_view`;
      const bodyParams = {};

      const { result_id, section, pod_id, num_results_viewed } = parameters;

      if (result_id) {
        bodyParams.result_id = result_id;
      }

      if (section) {
        bodyParams.section = section;
      } else {
        bodyParams.section = 'Products';
      }

      if (pod_id) {
        bodyParams.pod_id = pod_id;
      }

      if (num_results_viewed) {
        bodyParams.num_results_viewed = num_results_viewed;
      }

      this.requests.queue(url, 'POST', applyParams(bodyParams, this.options));
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send recommendation click through event to API
   *
   * @function trackRecommendationClickThrough
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.result_id - Result identifier
   * @param {string} parameters.section - Results section (defaults to "Products")
   * @param {string} parameters.pod_id - Pod identifier
   * @param {string} parameters.item_id - ID of clicked item
   * @param {string} parameters.variation_id - Variation ID of clicked item
   * @param {number} parameters.item_position - Position of clicked item
   * @param {string} parameters.strategy_id - Strategy identifier
   * @returns {(true|Error)}
   */
  trackRecommendationClickThrough(parameters) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const url = `${this.options.serviceUrl}/v2/behavior/recommendation_result_click_through`;
      const bodyParams = {};

      const {
        result_id,
        section,
        pod_id,
        item_id,
        variation_id,
        item_position,
        strategy_id,
      } = parameters;

      if (result_id) {
        bodyParams.result_id = result_id;
      }

      if (section) {
        bodyParams.section = section;
      } else {
        bodyParams.section = 'Products';
      }

      if (pod_id) {
        bodyParams.pod_id = pod_id;
      }

      if (item_id) {
        bodyParams.item_id = item_id;
      }

      if (variation_id) {
        bodyParams.variation_id = variation_id;
      }

      if (item_position) {
        bodyParams.position = item_position;
      }

      if (strategy_id) {
        bodyParams.strategy_id = strategy_id;
      }

      this.requests.queue(url, 'POST', applyParams(bodyParams, this.options));
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }
}

module.exports = Tracker;