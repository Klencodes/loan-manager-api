const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    email: { type: String, unique: true, trim: true, required: true },
    passwordHash: { type: String, required: true },
    phoneNumber:  { type: String, required: true },
    title: { type: String, required: true },
    facebook:  String,
    linkedin:  String, 
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    jobTitle: { type: String, required: true },
    department: { type: String, required: true },
    dob: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    acceptTerms: Boolean,
    role: { type: String, required: true },
    verificationToken: String,
    verified: Date,
    resetToken: { token: String, expires: Date },
    passwordReset: Date,
    created: { type: Date, default: Date.now },
    updated: Date
});

schema.virtual('isVerified').get(function () {
    return !!(this.verified || this.passwordReset);
});

schema.set('toJSON', { virtuals: true, versionKey: false,
    transform: function (doc, ret) {
        // remove these props when object is serialized
        delete ret._id;
        delete ret.passwordHash;
    }
});

module.exports = mongoose.model('Account', schema);