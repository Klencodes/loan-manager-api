const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({

  accountId: {
    type: mongoose.Types.ObjectId, ref: "Account",
    required: true
  },
  loanType: { type: String, required: true, trim: true },
  loanAmount: { type: Number, required: true, trim: true },
  created: { type: Date, default: Date.now },
  loanStatus: { type: String, required: true, trim: true },
  statusDate: { type: Date, default: Date.now },
});
//Customized id to replace default _id parsed to client server
schema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = mongoose.model('Loan', schema);