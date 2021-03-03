const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  accountId: {
    type: mongoose.Types.ObjectId, ref: "Account",
    required: true
  },
  loanId: {
    type: mongoose.Types.ObjectId, ref: "Loan",
    required: true
  },
  amountPaid: {type: Number, required: true, trim: true},
  transaction: {type: String, required: true, trim: true},
  paymentType: { type: String, required: true, trim: true },
  paymentDate: { type: Date, default: Date.now },
  paymentAccount: { type: String, required: true, trim: true },
  paymentStatus: String,
  paymentStatusDate: { type: Date, default: Date.now },
});

//Customized id to replace default _id parsed to client server
schema.method("toJSON", function() {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = mongoose.model('Payment', schema);