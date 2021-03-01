const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  loanId: {
    type: mongoose.Types.ObjectId, ref: "Loan",
    required: true
  },
  idCard: { type: String, required: true, trim: true },
  idNumber: { type: String, unique: true, trim: true, required: true },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now  },
  // docFile: { type: File, required: true, trim: true },
});

//Customized id to replace default _id parsed to client server
schema.method("toJSON", function() {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = mongoose.model('Document', schema);