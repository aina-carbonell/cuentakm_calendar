/**
 * Punto de entrada para utilidades
 */

const dateUtils = require('./date-utils');
const numberUtils = require('./number-utils');
const validationUtils = require('./validation-utils');
const logger = require('./logger');
const storageUtils = require('./storage-utils');
const stringUtils = require('./string-utils');
const distanceUtils = require('./distance-utils.js');

module.exports = {
  ...dateUtils,
  ...numberUtils,
  ...validationUtils,
  ...logger,
  ...storageUtils,
  ...stringUtils,
  ...distanceUtils
};