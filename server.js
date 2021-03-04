require('rootpath')();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('./middleware/error-haddler');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// CORS HEADERS MIDDLEWARE
app.use(cors({ 
  origin: (origin, callback) => callback(null, true),
  methods: ['GET', 'PUT', 'DELETE', 'PATCH', 'POST', 'OPTIONS'],
  allowedHeaders: 'Content-Type, Authorization, XMLHttpRequest, Origin, X-Requested-With, Accept',
  credentials: true 
}));

// app.use(cors({
//     origin: 'http://localhost:4200',
//     methods: ['GET', 'PUT', 'DELETE', 'PATCH', 'POST', 'OPTIONS'],
//     allowedHeaders: 'Content-Type, Authorization, XMLHttpRequest, Origin, X-Requested-With, Accept',
//     credentials: true
// }));

/* API ROUTES */
app.use('/accounts', require('./routes/accounts/account.controller'));
app.use('/loans', require('./routes/loans/loan.controllers'));
app.use('/payments', require('./routes/payments/payment.controller'));

/* Search Existing Customers */
app.get('/', function (req, res, next) {
    res.send('YOU ARE GOOD TO GO!!!');
  });
// global error handler
app.use(errorHandler);

// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
app.listen(port, () => {
    console.log('Server listening on port ' + port);
});