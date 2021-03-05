const express = require('express');
const authorize = require('../../middleware/authorize');
const router = express.Router();
const db = require('../../_helpers/db');
const Role = require('../../_helpers/role')
const status = require('./status');

module.exports = router;


/**
 * STARTS ADMIN ROUTES (Restricted to only Admin)
/**

 * GET /payments/all-payments
 * Purpose: Admin Get all payments and by accountId(userId => req.user.id)
 */
router.get('/all-payments', authorize(Role.Admin), (req, res) => {
    // We want to return an array of all the payments in the database 
    db.Payment.find({
    }).populate('accountId').populate('loanId').then((payments) => {
        res.send({ status: 200,  message: "Payments returned successfully", totalPayments: payments.length, payments });
    }).catch((e) => {
        res.send(e);
    });
})
 
/**
 * GET /payments/find-payments/:id
 * Purpose: Authorized user get all payments requested
 */
router.get('/find-payments/:id', authorize(Role.Admin), (req, res) => {
    // We want to return an array of all the payments that belong to the authenticated user 
    db.Payment.findOne({
        _id: req.params.id
    }).populate('loanId').populate('accountId').then((payment) => {
        res.send({ status: 200, message: "Payment returned successfully",  payment });
    }).catch((e) => {
        res.send(e);
    });
});

/* POST /payments
 * Purpose: Confirm payments
 */
router.patch('/:id', authorize(Role.Admin), (req, res) => {
    // confirm payment user made by user 
    db.Payment.findOneAndUpdate({
        _id: req.params.id
    }, {
        $set: req.body,
        paymentStatusDate: Date.now()
    }).then((payment) => {
        res.send({ status: 200, message: "Payment confirmed successfully", payment });
    }).catch((e) => {
        res.send(e);
    });
});


/**
 * STARTS
 * AUTHENTICED USER ROUTES (ADMINS AND USERS)
 */ 
/**
 * POST /payments
 * Purpose: All users get all payments
 */
router.get('/', authorize(), (req, res) => {
    // We want to return an array of all the payments that belong to the authenticated user 
    db.Payment.find({
        accountId: req.user.id,
    }).populate('loanId').then((payments) => {
        res.send({ status: 200, message: "Payments returned successfully",  count: payments.length, payments });
    }).catch((e) => {
        res.send(e);
    });
});

/**
 * POST /payments
 * Purpose: All users can make payment
 */
router.post('/:loanId', authorize(), (req, res) => {
    // We want to create a new document in a loan specified by loanId

    db.Loan.findOne({
        accountId: req.user.id ,  //account id from account collection referenced in payment.model.js
        _id: req.params.loanId   //loan id from loan collection referenced in payment.model.js and parse in the route as /:loanId
    }).then((loan) => {
        if (loan) {
            // loan object with the specified conditions was found
            // therefore the currently authenticated user can create new tasks
            return true;
        }

        // else - the list object is undefined
        return false;
    }).then((canMakePayemnt) => {
        if (canMakePayemnt) {
            
            const { amountPaid, transaction, paymentType, paymentAccount, paymentStatusDate } = req.body

            let payment = new db.Payment({
                accountId: req.user.id, //account id from account collection referenced in payment.model.js
                loanId: req.params.loanId, //loan id from loan collection referenced in payment.model.js
                amountPaid,
                transaction,
                paymentType, 
                paymentAccount,
                paymentStatus: status.Pending,
            });
            payment.save().then((paymentDoc) => {
                res.send({ status: 200, message: "Payment made successfully waiting for comfirmation", paymentDoc });
            })
        } else {
            res.send({ status: 404, message: "Unable to make payment" });
        }
    })
});

/**
 * GET /:loanId/payments
 * Purpose: Get all payments in a specific loan
 */
router.get('/:loanId/loan-payments', authorize(), (req, res) => {
    // We want to return all payments that belong to a specific loan (specified by loanId)
    db.Loan.findOne({
        _id: req.params.loanId,
        accountId: req.user.id
    }).then((loan) => {
        if (loan) {
            // loan object with the specified conditions was found
            // therefore the currently authenticated user can get payment within this loan
            return true;
        }
        // else - the loan object is undefined
        return false;
    }).then((canGetPaymnent) => {
        if (canGetPaymnent) {
            // the currently authenticated user can get document
            db.Payment.find({
                loanId: req.params.loanId
            }).populate('loanId').then((payments) => {
                res.send({ status: 200, count: payments.length, message: 'Payment returned successfully', payments })
            })
        } else {
            res.send({ status: 404, message: "Can't find Payment" })
        }
    })
});

/**
 * GET /:loanId/get-payment/:id
 * Purpose: Get an existing payment
 */
router.get('/:loanId/loan-payments/:id', authorize(), (req, res) => {
    // We want to get an existing document (specified by docId)

    db.Loan.findOne({
        _id: req.params.loanId,
        accountId: req.user.id
    }).then((loan) => {
        if (loan) {
            // loan object with the specified conditions was found
            // therefore the currently authenticated user can get payment within this loan
            return true;
        }
        // else - the loan object is undefined
        return false;
    }).then((canGetPaymnent) => {
        if (canGetPaymnent) {
            // the currently authenticated user can get document
            db.Payment.findOne({
                _id: req.params.id,
                loanId: req.params.loanId
            }).populate('loanId').then((payment) => {
                res.send({ status: 200, message: 'Payment returned successfully', payment })
            })
        } else {
            res.send({ status: 404, message: "Can't find Payment" })
        }
    })
});
