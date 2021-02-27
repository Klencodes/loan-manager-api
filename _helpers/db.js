const config = require('config.json');
const mongoose = require('mongoose');
const connectionOptions = { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false };
mongoose.connect(process.env.MONGODB_URI || config.connectionString, connectionOptions).then(() => {
    console.log('Connected to Database successfully');
    
}).catch((e) => {
    console.log('Cannot connect to MongoDB');
    console.log(e);

});
mongoose.Promise = global.Promise;

function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

module.exports = {
    isValidId,
    Account: require('../routes/accounts/account.model'),
    RefreshToken: require('../routes/accounts/refresh-token.model'),
    Loan: require('../routes/loans/loan.model'),
    Document: require('../routes/loans/document.model'),
    Payment: require('../routes/payments/payment.model'),
};
