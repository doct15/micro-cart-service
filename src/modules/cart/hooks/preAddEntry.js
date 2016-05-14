const Boom = require('boom');

function preAddEntry(base) {
  return function (cart, product) {
    // maxQuantityPerProduct check
    const maxQuantityPerProduct = base.config.get('maxQuantityPerProduct');
    if (maxQuantityPerProduct) {
      let quantity = product.quantity;
      const entry = cart.entries.find(p => p.code === product.code);
      if (entry) {
        quantity += product.quantity;
      }
      if (quantity > maxQuantityPerProduct) {
        throw Boom.notAcceptable(`Quantity in cart for this product must be less than or equal to ${maxQuantityPerProduct}`);
      }
    }
  };
}

module.exports = preAddEntry;
