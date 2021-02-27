const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  
  loanId: {
    type: mongoose.Types.ObjectId, ref: "Loan",
    required: true
  },
  amount: {type: Number, required: true, trim: true},
  created: { type: Date, default: Date.now }  
});

//Customized id to replace default _id parsed to client server
schema.method("toJSON", function() {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = mongoose.model('Payment', schema);