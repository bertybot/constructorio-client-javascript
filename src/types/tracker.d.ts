import EventEmitter = require('events');
import { ConstructorClientOptions, NetworkParameters } from '.';
import RequestQueue = require('../utils/request-queue');

export default Tracker;

declare class Tracker {
  constructor(options: ConstructorClientOptions);

  private options: ConstructorClientOptions;

  private eventemitter: EventEmitter;

  private requests: RequestQueue;

  trackSessionStart(networkParameters?: NetworkParameters): true | Error;

  trackInputFocus(networkParameters?: NetworkParameters): true | Error;

  trackItemDetailLoad(
    parameters: {
      item_name: string;
      item_id: string;
      variation_id?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackAutocompleteSelect(
    term: string,
    parameters: {
      original_query: string;
      section: string;
      tr?: string;
      group_id?: string;
      display_name?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackSearchSubmit(
    term: string,
    parameters: {
      original_query: string;
      group_id?: string;
      display_name?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackSearchResultsLoaded(
    term: string,
    parameters: {
      num_results: number;
      item_ids?: string[];
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackSearchResultClick(
    term: string,
    parameters: {
      item_name: string;
      item_id: string;
      variation_id?: string;
      result_id?: string;
      item_is_convertible?: string;
      section?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackConversion(
    term?: string,
    parameters: {
      item_id: string;
      revenue?: number;
      item_name?: string;
      variation_id?: string;
      type?: string;
      is_custom_type?: boolean;
      display_name?: string;
      result_id?: string;
      section?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackPurchase(
    parameters: {
      items: object[];
      revenue: number;
      order_id?: string;
      section?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackRecommendationView(
    parameters: {
      url: string;
      pod_id: string;
      num_results_viewed: number;
      items?: object[];
      result_count?: number;
      result_page?: number;
      result_id?: string;
      section?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackRecommendationClick(
    parameters: {
      pod_id: string;
      strategy_id: string;
      item_id: string;
      item_name: string;
      variation_id?: string;
      section?: string;
      result_id?: string;
      result_count?: number;
      result_page?: number;
      result_position_on_page?: number;
      num_results_per_page?: number;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackBrowseResultsLoaded(
    parameters: {
      url: string;
      filter_name: string;
      filter_value: string;
      section?: string;
      result_count?: number;
      result_page?: number;
      result_id?: string;
      selected_filters?: object;
      sort_order?: string;
      sort_by?: string;
      items?: object[];
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackBrowseResultClick(
    parameters: {
      filter_name: string;
      filter_value: string;
      item_id: string;
      section?: string;
      variation_id?: string;
      result_id?: string;
      result_count?: number;
      result_page?: number;
      result_position_on_page?: number;
      num_results_per_page?: number;
      selected_filters?: object;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackGenericResultClick(
    parameters: {
      item_id: string;
      item_name?: string;
      variation_id?: string;
      section?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackQuizResultsLoaded(
    parameters: {
      quiz_id: string;
      quiz_version_id: string;
      quiz_session_id: string;
      url: string;
      section?: string;
      result_count?: number;
      result_page?: number;
      result_id?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackQuizResultClick(
    parameters: {
      quiz_id: string;
      quiz_version_id: string;
      quiz_session_id: string;
      item_id?: string;
      item_name?: string;
      section?: string;
      result_count?: number;
      result_page?: number;
      result_id?: string;
      result_position_on_page?: number;
      num_results_per_page?: number;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackQuizConversion(
    parameters: {
      quiz_id: string;
      quiz_version_id: string;
      quiz_session_id: string;
      item_id?: string;
      item_name?: string;
      section?: string;
      variation_id?: string;
      revenue?: string;
      type?: string;
      is_custom_type?: boolean;
      display_name?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  on(messageType: string, callback: Function): true | Error;
}
