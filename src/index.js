'use strict';

/**
 * Module dependencies.
 */

const { Converter } = require('csvtojson');
const Promise = require('bluebird');
const jsdom = require('jsdom');
const sleep = require('sleep-promise');
const fs = require('fs');
const db = require('diskdb');
const dbname = 'words';

/**
 * Promisify modules.
 */

Promise.promisifyAll(jsdom);
Promise.promisifyAll(Converter.prototype);
Promise.promisifyAll(sleep);

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
 * Inserts or updates record in db
 */
function persist(value, collection) {
  const query = {
    ptPT: value.ptPT
  };

  const options = {
    multi: false,
    upsert: true
  };

  db[collection].update(query, value, options);
}

/**
 * Grab languages from inputs.
 */

async function grab() {
  const inputs = await new Converter({}).fromFileAsync('src/input.csv');
  const results = [];

  db.connect('.', [dbname]);

  for (const input of inputs) {
    for (const language in config) {
      const { url, selector } = config[language];
      const word = encodeURIComponent(input[language]);
      const window = await jsdom.envAsync(`${url}${word}`, ['http://code.jquery.com/jquery.js']);
      const text = window.$(selector);

      if (text.length === 0) {
        console.error(`Could not retrieve ${language} translation for ${word} request is ${url}${word}`);

        continue;
      }
      input.translation = input.translation || {};
      input.translation[language] = text[0].innerHTML;
      results.push(input);
      persist(input, dbname);

      if (word === undefined) {
        console.log(`Word ${word}, input: ${JSON.stringify(input)}, language: ${language}`);
      }
      console.log(`Found ${language} translation for ${word}: ${text[0].innerHTML}`);
      await sleep(5000);
    }
    await sleep(5000);
  }

  return results;
}

/**
 * Main entry point.
 */

grab()
  .then(results => {
    console.log(`Retrieved ${results.length} results`);
    fs.writeFileSync('/tmp/output.json', JSON.stringify(results), 'utf-8');
  })
  .catch(e => console.error(e));
