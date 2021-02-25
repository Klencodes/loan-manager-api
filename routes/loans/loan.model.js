const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  
  accountId: {
    type: mongoose.Types.ObjectId, ref: "Account",
    required: true
  },
  type: {type: String, required: true, trim: true},
  amount: {type: Number, required: true, trim: true},
  created: { type: Date, default: Date.now },
  status: String,
  statusDate: Date,
 
  
});
//Customized id to replace default _id parsed to client server
schema.method("toJSON", function() {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = mongoose.model('Loan', schema);