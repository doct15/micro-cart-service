const Boom = require('boom');

function postAddEntry(base) {

  return function (cart, product) {

    // maxNumberOfEntries check
    const maxNumberOfEntries = base.config.get('maxNumberOfEntries');
    if (maxNumberOfEntries) {
      if (cart.entries.length > maxNumberOfEntries) {
        throw Boom.notAcceptable(`Number of entries must be less than or equal to ${maxNumberOfEntries}`);
      }
    }
  };
}

module.exports = postAddEntry;
