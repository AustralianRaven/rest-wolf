import { find } from 'lodash';
import { getDefaultRequestPaneTab } from './index';

/**
 * Gets the appropriate requestPaneTab for a new tab, preserving the current tab if possible
 * @param {Object} item - The item to get the tab for
 * @param {Array} tabs - All tabs
 * @param {String} activeTabUid - The currently active tab UID
 * @returns {String} The tab to use for the new request
 */
export const getPreservedRequestPaneTab = (item, tabs, activeTabUid) => {
  // Get the currently active tab to preserve its requestPaneTab
  const currentActiveTab = find(tabs, (t) => t.uid === activeTabUid);
  const currentRequestPaneTab = currentActiveTab?.requestPaneTab;

  // Use the current tab if available and it's a valid tab for this request type,
  // otherwise fall back to the default tab
  let requestPaneTabToUse = getDefaultRequestPaneTab(item);

  if (currentRequestPaneTab) {
    // Define valid tabs for each request type
    const validTabs = {
      'http-request': ['params', 'body', 'headers', 'auth', 'vars', 'script', 'assert', 'tests', 'docs', 'settings'],
      'graphql-request': ['query', 'headers', 'auth', 'vars', 'script', 'assert', 'tests', 'docs', 'settings'],
      'grpc-request': ['body', 'headers', 'auth', 'docs'],
      'ws-request': ['body', 'headers', 'auth', 'settings', 'docs']
    };

    const itemType = item.type || 'http-request';
    const itemValidTabs = validTabs[itemType] || validTabs['http-request'];

    if (itemValidTabs.includes(currentRequestPaneTab)) {
      requestPaneTabToUse = currentRequestPaneTab;
    }
  }

  return requestPaneTabToUse;
};

/**
 * Gets the preserved tab for request types that are passed as strings (for new requests)
 */
export const getPreservedRequestPaneTabForType = (requestType, tabs, activeTabUid) => {
  return getPreservedRequestPaneTab({ type: requestType }, tabs, activeTabUid);
};
