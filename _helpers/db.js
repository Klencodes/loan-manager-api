const config = require('config.json');
const mongoose = require('mongoose');
const connectionOptions = { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false };
mongoose.connect(process.env.MONGODB_URI || config.connectionString, connectionOptions);
mongoose.Promise = global.Promise;

module.exports = {
    isValidId,
    Account: require('../routes/accounts/account.model'),
    RefreshToken: require('../routes/accounts/refresh-token.model'),
};

function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}