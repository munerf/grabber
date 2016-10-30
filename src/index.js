'use strict';

const jsdom = require('jsdom');
let words = ['dog', 'cat', 'banana'];
//words = ['tomato'];

let input = {en: 'dog', pt: 'cão', es: 'perro', de: 'Hund'};

const gbSelector = '*[data-src=hc_dict] .pron';
const usSelector = '*[data-src=rHouse] .pron';
const ptSelector = '';
const deSelector = '';
const esSelector = '';

function getResults() {
for (const word of words) {
  jsdom.env(
  `http://www.thefreedictionary.com/${word}`,
  ['http://code.jquery.com/jquery.js'],
  function(err, window) {
    let en = window.$(gbSelector);
    let us = window.$(usSelector);
    console.log('Requesting', word, 'and the result in en_GB is:', en[0].innerHTML, 'and in en_US is', us[0].innerHTML);
  });
}
}

getResults();
