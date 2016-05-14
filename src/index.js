const baseFactory = require('micro-base');
const cartFactory = require('./modules/cart');

// Instantiate micro-base
const base = baseFactory();

// Add operations
base.services.addModule(cartFactory(base));

// Return express app for easy testing
module.exports = base.app;
