const moment = require('moment');
const shortId = require('shortid');
const Boom = require('boom');

function cartService(base) {
  base.logger.info(`[service] Instantiating [${base
     .config.get('services:name')}][${base.config.get('services:version')}]`);

  const cartExpirationDays = base.config.get('cartExpirationDays');
  const maxNumberOfEntriesPerProduct = base.config.get('maxNumberOfEntriesPerProduct');

  // Register model(s)
  const Cart = require(base.config.get('models:cartModel'))(base);

  /*
   Creates a new cart
   */
  const newCart = {
    name: 'new',
    handler: (msg, reply) => {
      const cart = new Cart({
        _id: shortId.generate(),
        uid: msg.uid || 'anonymous',
        entries: [],
        expirationTime: moment().add(cartExpirationDays, 'days').toDate()
      });
      cart.save(error => {
        if (error) return reply(Boom.wrap(error));
        return reply(cart.toClient());
      });
    }
  };

  /*
    Finds a Cart and returns it
  */
  const getCart = {
    name: 'get',
    handler: (msg, reply) => {
      Cart.findById(msg.id).then(cart => {
        if (!cart) return reply(Boom.notFound());
        return reply(cart.toClient());
      }).catch(error => {
        reply(Boom.wrap(error));
      });
    }
  };

  /*
    Adds an entry to an existing Cart
  */
  const preAddEntry = require(base.config.get('hooks:preAddEntry'))(base);
  const postAddEntry = require(base.config.get('hooks:postAddEntry'))(base);

  const addEntry = {
    name: 'addEntry',
    schema: require(base.config.get('schemas:addEntry')),
    handler: ({ cartId, product }, reply) => {
      Cart.findById(cartId)
         .then(cart => {
           if (!cart) return reply(Boom.notFound());
           cart.entries = cart.entries || [];

           // preAddEntry Hook
           preAddEntry(cart, product);

           let entry = cart.entries.find(p => p.code === product.code);
           if (entry) {
             entry.quantity += product.quantity;
           } else {
             entry = {
               code: product.code,
               quantity: product.quantity
             };
             cart.entries.push(entry);
           }
           // postAddToCart Hook
           postAddEntry(cart, product);

           return cart.save();
         })
         .then(cart => {
           return reply(cart.toClient());
         })
         .catch(error => {
           if (error.isBoom) return reply(error);
           return reply(Boom.wrap(error));
         });
    }
  };

  return [
    newCart,
    getCart,
    addEntry
  ];
}

module.exports = cartService;
