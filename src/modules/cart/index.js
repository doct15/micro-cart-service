const moment = require('moment');

function cartService(base) {
  base.logger.info(`[service] Instantiating ${base
     .config.get('services:name')}:${base.config.get('services:version')}`);

  const cartExpirationDays = base.config.get('cartExpirationDays');
  const maxNumberOfEntriesPerProduct = base.config.get('maxNumberOfEntriesPerProduct');
  const entities = base.services.use('entity');

  /*
    Creates a new Cart
  */
  const newCart = {
    pattern: { op: 'new' },
    handler: (msg, done) => {
      const cart = entities.make('cart');
      cart.user = msg.uid || 'anonymous';
      cart.entries = [];
      cart.expirationTime = moment().add(cartExpirationDays, 'days').toDate();
      return cart.save$(done);
    }
  };

  /*
    Finds a Cart and returns it
  */
  const getCart = {
    pattern: { op: 'get' },
    handler: (msg, done) => {
      const cart = entities.make('cart');
      cart.load$(msg.id, (error, result) => {
        if (error) return done(error);
        if (result == null) {
          return done(null, { error: { code: 101, msg: 'Cart doesn\'t exist' } });
        }
        return done(null, result);
      });
    }
  };

  /*
    Adds an entry to an existing Cart
  */
  const addEntry = {
    pattern: { op: 'addEntry' },
    schema: {
      $schema: 'http://json-schema.org/schema#',
      id: 'http://yourdomain.com/schemas/myschema.json',
      type: 'object',
      properties: {
        cartId: { type: 'string' }
      }
    },
    handler: ({ cartId, product }, done) => {
      base.services.act({ service: 'cart', op: 'get', id: cartId })
         .then(cart => {
           if (cart.error) {
             return done(null, cart);
           }

           let entry = cart.entries.find(p => p.code === product.code);
           if (entry) {
             // Move to an strategy or something customizable
             if (entry.quantity + product.quantity > maxNumberOfEntriesPerProduct) {
               return done(null, {
                 error: {
                   code: 202,
                   msg: `Quantity must be less than or equal to ${maxNumberOfEntriesPerProduct}`
                 }
               });
             }
             entry.quantity += product.quantity;
           } else {
             entry = {
               code: product.code,
               quantity: product.quantity
             };
             cart.entries.push(entry);
           }

           return cart.save$(done);
         })
         .catch(error => {
           base.logger.error('****************', error.msg);
           return done(error);
         });
    }
  }

  return [
    newCart,
    getCart,
    addEntry
  ];
};

module.exports = cartService;