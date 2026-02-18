/**
 * Punto de entrada para utilidades
 */

const dateUtils = require('./date-utils');
const numberUtils = require('./number-utils');
const validationUtils = require('./validation-utils');
const storageUtils = require('./storage-utils');
const stringUtils = require('./string-utils');
const distanceUtils = require('./distance-utils');

module.exports = {
  ...dateUtils,
  ...numberUtils,
  ...validationUtils,
  ...storageUtils,
  ...stringUtils,
  ...distanceUtils
};