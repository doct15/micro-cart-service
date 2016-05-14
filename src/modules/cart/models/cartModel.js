function modelFactory(base) {

  var entrySchema = base.db.Schema({
    code: {type: String, required: true},
    quantity: {type: Number, required: true}
  }, {_id: false, minimize: false})

  var schema = base.db.Schema({
    _id: {type: String, required: true},
    uid: {type: String, required: true},
    expirationTime: {type: Date, required: true},
    entries: [entrySchema]
  }, {_id: false, minimize: false, timestamps: true});

  schema.set('toJSON', {
    virtuals: true
  });

  schema.method('toClient', function () {
    var obj = this.toJSON();
    delete obj._id;
    delete obj.__v;
    delete obj.createdAt;
    delete obj.updatedAt;
    return obj;
  });

  return base.db.model('Cart', schema);
}

module.exports = modelFactory;
