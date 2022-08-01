/*
 * enables jsdom globally.
 */
const JSDOM = require('jsdom');

const defaultHtml = '<!doctype html><html><body></body></html>';

// define this here so that we only ever dynamically populate KEYS once.

const KEYS = [];

function globalJsdom(options = {}) {
  // Idempotency
  if (global.navigator
    && global.navigator.userAgent
    && global.navigator.userAgent.includes('Node.js')
    && global.document
    && typeof global.document.destroy === 'function') {
    return global.document.destroy;
  }

  if (!('url' in options)) {
    Object.assign(options, { url: 'http://localhost' });
  }

  const jsdom = new JSDOM.JSDOM(defaultHtml, options);
  const { window } = jsdom;
  const { document } = window;

  // generate our list of keys by enumerating document.window - this list may vary
  // based on the jsdom version. filter out internal methods as well as anything
  // that node already defines

  if (KEYS.length === 0) {
    KEYS.push(...Object.getOwnPropertyNames(window).filter((k) => !k.startsWith('_')).filter((k) => !(k in global)));
    KEYS.push('$jsdom');
  }
  // eslint-disable-next-line no-return-assign
  KEYS.forEach((key) => global[key] = window[key]);

  // setup document / window / window.console
  global.document = document;
  global.window = window;
  window.console = global.console;

  // add access to our jsdom instance
  global.$jsdom = jsdom;

  const cleanup = () => {
    KEYS.forEach((key) => delete global[key]);
    delete global.document;
    delete global.window;
  };

  document.destroy = cleanup;

  return cleanup;
}

module.exports = globalJsdom;