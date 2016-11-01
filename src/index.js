'use strict';

/**
 * Module dependencies.
 */

const { Converter } = require('csvtojson');
const Promise = require('bluebird');
const jsdom = require('jsdom');

/**
 * Promisify modules.
 */

Promise.promisifyAll(jsdom);
Promise.promisifyAll(Converter.prototype);

/**
 * Instances.
 */

const config = {
  deDE: { selector: '*[data-src=kdict] .pron', url: 'http://de.thefreedictionary.com/' },
  enGB: { selector: '*[data-src=hc_dict] .pron', url: 'http://en.thefreedictionary.com/' },
  enUS: { selector: '*[data-src=rHouse] .pron', url: 'http://us.thefreedictionary.com/' },
  esES: { selector: '*[data-src=kdict] .pron', url: 'http://es.thefreedictionary.com/' },
  ptPT: { selector: '*[data-src=kdict] .pron', url: 'http://pt.thefreedictionary.com/' }
};

/**
 * Grab languages from inputs.
 */

async function grab() {
  const inputs = await new Converter({}).fromFileAsync('src/input.csv');
  const results = {};

  for (const input of inputs) {
    for (const language in config) {
      const { url, selector } = config[language];
      const word = input[language];
      const window = await jsdom.envAsync(`${url}${word}`, ['http://code.jquery.com/jquery.js']);
      const text = window.$(selector);

      if (text.length === 0) {
        console.error(`Could not retrieve ${language} translation for ${word}`);

        continue;
      }

      results[language] = text[0].innerHTML;

      console.log(`Found ${language} translation for ${word}: ${text[0].innerHTML}`);
    }
  }

  return results;
}

/**
 * Main entry point.
 */

grab()
  .then(results => {
    console.log(`Retrieved ${Object.keys(results).length} results`);
  })
  .catch(e => console.error(e));
