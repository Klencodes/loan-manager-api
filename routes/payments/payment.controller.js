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

 * GET /payments
 * Purpose: Admin Get all payments and by accountId(userId => req.user.id)
 */
router.get('/find-all', authorize(Role.Admin), (req, res) => {
    // We want to return an array of all the payments in the database 
    db.Payment.find({
    }).populate('accountId').populate('loanId').then((payments) => {
        res.send({ status: 200,  message: "payments returned successfully", totalPayments: payments.length, payments });
    }).catch((e) => {
        res.send(e);
    });
})

 /**
 * PATCH /:loanId/confirm-payment/:id
 * Purpose: Confirm payment made by user
 */

router.patch('/:loanId/confirm-payment/:id', authorize(Role.Admin), (req, res) => {
    // We want to Confirm payment(specified by payment id)

    db.Loan.findOne({
        _id: req.params.loanId,
    }).then((loan) => {
        if (loan) {
            // list object with the specified conditions was found
            // therefore the currently authenticated user can make updates to tasks within this list
            return true;
        }
        // else - the list object is undefined
        return false;
    }).then((canConfirmPayment) => {
        if (canConfirmPayment) {
            // the currently authenticated user can update tasks
            db.Payment.findOneAndUpdate({
                _id: req.params.id,
                loanId: req.params.loanId
            }, {
                    $set: req.body,
                    paymentStatusDate: Date.now()
                }
            ).then((confirmedPayment) => {
                res.send({ status: 200, message: 'Payment Confirmed.', confirmedPayment })
            })
        } else {
            res.send({status: 404, message:"Can't confirm payment"});
        }
    })
});
 

/**
 * STARTS
 * AUTHENTICED USER ROUTES (ADMINS AND USERS)
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
                paymentStatusDate,
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
 * GET /payments
 * Purpose: Authorized user get all payments requested
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
 * GET /:loanId/get-payment/:id
 * Purpose: Get an existing payment
 */
router.get('/:loanId/payment/:id', authorize(), (req, res) => {
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
