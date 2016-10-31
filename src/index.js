'use strict';

const jsdom = require('jsdom');
const async = require('async');

const Converter = require('csvtojson').Converter;
const converter = new Converter({});

let pool = [];

const config = {
  enUS: {url: 'http://us.thefreedictionary.com/', selector: '*[data-src=rHouse] .pron'},
  enGB: {url: 'http://en.thefreedictionary.com/', selector: '*[data-src=hc_dict] .pron'},
  ptPT: {url: 'http://pt.thefreedictionary.com/', selector: '*[data-src=kdict] .pron'},
  esES: {url: 'http://es.thefreedictionary.com/', selector: '*[data-src=kdict] .pron'},
  deDE: {url: 'http://de.thefreedictionary.com/', selector: '*[data-src=kdict] .pron'},
};

converter.fromFile('test/input.csv', function(err, inputs) {
  async.each(inputs,
    function(input, callback) {
      const cfg = config; return fetchResults(cfg, input, callback);
     },
  function(err) {
    if(!err) {
      console.log('complete');
    } else {
      console.log('Something has failed  with errors');
    }
  });
});

function fetchLanguageResult(languageConfig, input, callback) {
  jsdom.env(`${languageConfig.url}${encodeURIComponent(input)}`,
           ['http://code.jquery.com/jquery.js'],
           function(err, window) {
             let text = window.$(languageConfig.selector);
             if(text.length > 0) {
               console.log('Requesting', input,
                           'and the result is:', text[0].innerHTML);
                           pool.push(text[0].innerHTML);
                            return callback();
             }else {
               console.log('Failed ->', input);
               callback('Something went wrong');
             }
           });
}

function fetchResults(config, input, callback) {
  let languages = Object.keys(input);

  async.each(languages, function(language, callback) {
    let languageConfig = config[language];
    let word = input[language];
    fetchLanguageResult(languageConfig, word, callback);
  }, function(err) {
    if(!err) {
      console.log('complete');
      console.log(pool);
    } else {
      console.log('Something has failed  with errors');
    }
  });
}
