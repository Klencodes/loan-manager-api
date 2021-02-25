const express = require('express');
const authorize = require('../../middleware/authorize');
const router = express.Router();
const db = require('../../_helpers/db');
const Role = require('../../_helpers/role');
const Status = require('../../_helpers/status');


module.exports = router

/* LOAN ROUTES */

/**
 * GET /loans
 * Purpose: Admin Get all loans and by accountId(userId => req.user.id)
 */
router.get('/all', authorize(Role.Admin), (req, res) => {
    // We want to return an array of all the loans that belong to the authenticated user 
    db.Loan.find({}).then((loans) => {
        res.send({status: 200, totalLoans: loans.length, loans});
    }).catch((e) => {
        res.send(e);
    });
})


/**
 * GET /loans
 * Purpose: Get all loans associated with user
 */
router.get('/', authorize(), (req, res) => {
    // We want to return an array of all the loans that belong to the authenticated user 
    db.Loan.find({
        accountId: req.user.id
    }).populate('document')
        .then((loans) => {
        res.send({status: 200, count: loans.length, loans});
    }).catch((e) => {
        res.send(e);
    });
})

/**
 * POST /loans
 * Purpose: Create a loan
 */
router.post('/', authorize(), (req, res) => {
    // We want to create a new loan and return the new loan document back to the user (which includes the id)
    // The loan information (fields) will be passed in via the JSON request body
    const {type, amount, status } = req.body

    let newLoan = new db.Loan({
        accountId: req.user.id,
        type,
        amount,
        status: Status.Pending
    });
    newLoan.save().then((LoanDoc) => {
        // the full loan document is returned (incl. id)
        res.send({status: 200, count: LoanDoc.length, message: 'Loan requested successfully', LoanDoc})
        .catch((e) => {
            res.send(e);
        });
    })
});

/**
 * PATCH /loans/:id
 * Purpose: Update a specified loan
 * Only admin can Approve loan and Change values
//  */
router.patch('/:id', authorize(Role.Admin), (req, res) => {
    // We want to update the specified Loan (loan document with id in the URL) with the new values specified in the JSON body of the request
    db.Loan.findOneAndUpdate({ _id: req.params.id }, {
        $set: req.body,
        statusDate: Date.now(), 

    }).then((loanApproved) => {
        res.send({ status: 200, message: 'Loan approved successfully', loanApproved });
    }).catch((e) => {
        console.log(e)
    });;
});

/**
 * DELETE /loans/:id
 * Purpose: Delete a loan
 * Only admin can delete a loan
 */
router.delete('/:id', authorize(Role.Admin), (req, res) => {
    // We want to delete the specified loan (document with id in the URL)
    db.Loan.findOneAndRemove({
        _id: req.params.id,
        accountId: req.user.id
    }).then((removedLoanDoc) => {
        res.send({message: 'Loan removed successfully', removedLoanDoc});

        // delete all the documents that are in the deleted loan
        deletedocsFromLoan(removedLoanDoc._id);
    })
});

/**
 * GET /:loanId/documents
 * Purpose: Get all documents in a specific loan
 */
router.get('/:loanId/documents', authorize(), (req, res) => {
    // We want to return all tasks that belong to a specific list (specified by listId)
    db.LoanDocument.find({
        loanId: req.params.loanId
    }).then((documents) => {
        res.send({status: 200, count:documents.length, documents});
    })
});


/**
 * POST /:loanId/documents
 * Purpose: Create a new Documents in a specific Loan
 */
router.post('/:loanId/documents', authorize(), (req, res) => {
    // We want to create a new document in a loan specified by loanId

    db.Loan.findOne({
        _id: req.params.loanId,
        accountId: req.user.id
    }).then((loan) => {
        if (loan) {
            // loan object with the specified conditions was found
            // therefore the currently authenticated user can create new tasks
            return true;
        }
        // else - the list object is undefined
        return false;
    }).then((canCreateTask) => {
        if (canCreateTask) {
            const { idCard, idNumber } = req.body
            let newDocument = new db.LoanDocument({
                idCard, idNumber,
                loanId: req.params.loanId
            });
            newDocument.save().then((newDocument) => {
                res.send({status: 200, newDocument});
            })
        } else {
            res.sendStatus(404);
        }
    })
})

/**
 * PATCH /:loanId/documents/:id
 * Purpose: Update an existing document
 */
router.patch('/:loanId/documents/:docId', authorize(), (req, res) => {
    // We want to update an existing document (specified by docId)

    db.Loan.findOne({
        _id: req.params.loanId,
        accountId: req.user.id
        }).then((loan) => {
        if (loan) {
            // loan object with the specified conditions was found
            // therefore the currently authenticated user can make updates to document within this loan
            return true;
        }

        // else - the loan object is undefined
        return false;
    }).then((canUpdateDoc) => {
        if (canUpdateDoc) {
            // the currently authenticated user can update document
            db.LoanDocument.findOneAndUpdate({
                _id: req.params.docId,
                loanId: req.params.loanId
            }, {
                    $set: req.body,
                    updated: Date.now()
                }
            ).then((updatedDoc) => {
                res.send({ status: 200, message: 'Document updated successfully', updatedDoc })
            })
        } else {
            res.send({ status: 404, message: "Can't update document" })
        }
    })
});

/**
 * DELETE /:loanId/documents/:docId
 * Purpose: Delete a task
 */
router.delete('/:loanId/documents/:docId', authorize(Role.Admin), (req, res) => {

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
    }).then((canDeleteDocs) => {
        
        if (canDeleteDocs) {
            db.LoanDocument.findOneAndRemove({
                _id: req.params.docId,
                loanId: req.params.loanId
            }).then((removedDoc) => {
                res.send({status: 200, message: 'Document removed successfully', removedDoc});
            })
        } else {
            res.send({status: 401, message: 'Unable to remove document'});
        }
    });
});


/* HELPER METHODS */
let deletedocsFromLoan = (loanId) => {
    Task.deleteMany({
        loanId
    }).then(() => {
        console.log("Documents from " + loanId + " were deleted!");
    })
}


