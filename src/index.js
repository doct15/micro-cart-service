const baseFactory = require('micro-base');
const cartFactory = require('./modules/cart');

// Instantiate with a module
const base = baseFactory({ module: cartFactory });

// Return express app for easy testing
module.exports = base.app;
