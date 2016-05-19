const Boom = require('boom');

/**
 * Hook to allow customization of the verification process before adding a product to the cart
 */
function preAddToCart(base) {
  const maxQuantityPerProduct = base.config.get('hooks:preAddEntry:maxQuantityPerProduct');
  const maxNumberOfEntries = base.config.get('hook:preAddEntry:maxNumberOfEntries');
  return (data /* cart, productId, quantity, warehouse */) => {
    // TODO Convert to Promises.all
    return new Promise((resolve, reject) => {
      // maxQuantityPerProduct check
      if (maxQuantityPerProduct) {
        let quantity = data.quantity;
        const entry = data.cart.items.find(p => p.code === data.productId);
        if (entry) {
          quantity += data.quantity;
        }
        if (quantity > maxQuantityPerProduct) {
          return reject(Boom.notAcceptable(`Quantity in cart for this product must be less than or equal to ${maxQuantityPerProduct}`));
        }
      }
      // maxNumberOfEntries check
      if (maxNumberOfEntries) {
        let itemCount = data.cart.items.length;
        const entry = data.cart.items.find(p => p.code === data.productId);
        if (!entry) {
          itemCount++;
        }
        if (itemCount > maxNumberOfEntries) {
          return reject(Boom.notAcceptable(`Number of entries must be less than or equal to ${maxNumberOfEntries}`));
        }
        return resolve(data);
      }
      // stockAvailability check
      const stockAvailability = base.services.loadModule('hooks:stockAvailability:handler');
      if (stockAvailability) {
        return stockAvailability(data.productId, data.quantity, data.warehouse).then(response => {
          // TODO verify in which case we return an "error" property
          if (response.error) return reject(Boom.create(response.statusCode, response.message));
          data.availability = response;
          return resolve(data);
        }).catch(error => {
          return reject(error);
        });
      }
      return resolve(data);
    });
  };
}

module.exports = preAddToCart;
