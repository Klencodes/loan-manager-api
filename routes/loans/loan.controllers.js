const express = require('express');
const authorize = require('../../middleware/authorize');
const router = express.Router();
const db = require('../../_helpers/db');
const Role = require('../../_helpers/role');
const Status = require('./status');

module.exports = router;

/**
 * STARTS ADMIN ROUTES (Restricted to only Admin)
/**

 * GET /loans
 * Purpose: Admin Get all loans and by accountId(userId => req.user.id)
 */
router.get('/all-loans', authorize(Role.Admin), (req, res) => {
    // We want to return an array of all the loans that belong to the authenticated user 
    db.Loan.find({
    }).populate('accountId').then((loans) => {
        res.send({ status: 200,  message: "Loans returned successfully", totalLoans: loans.length, loans });
    }).catch((e) => {
        res.send(e);
    });
})

/**
 * GET /loans/find/:id
 * Purpose: Get specific loan and populate associated user informations
 */
router.get('/find-loan/:loanId',  authorize(Role.Admin), (req, res) => {
    // We want to return an array of all the loans that belong to a user 
    db.Loan.findOne({
        _id: req.params.loanId
    }).populate('accountId').populate().then((loans) => {
        res.send({ status: 200, message: "Loan returned successfully",  count: loans.length, loans });
    }).catch((e) => {
        res.send(e);
    });
})

/**
 * PATCH /loans/:id
 * Purpose: Approve loan and Change values
 */
router.patch('/:loanId', authorize(Role.Admin), (req, res) => {
    // We want to update the specified Loan (loan document with id in the URL) with the new values specified in the JSON body of the request
    db.Loan.findOneAndUpdate({ _id: req.params.loanId }, {
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
 */
router.delete('/:loanId', authorize(Role.Admin), (req, res) => {
    // We want to delete the specified loan (document with id in the URL)
    db.Loan.findOneAndRemove({
        _id: req.params.loanId
    }).then((removedLoanDoc) => {
        res.send({ message: 'Loan removed successfully', removedLoanDoc });

        // delete all the documents that are in the deleted loan
        deletedocsFromLoan(removedLoanDoc.id);
    })
});

/**
 * POST /loans/:id
 * Purpose: Create a new Documents in a specific Loan
 */
router.post('/:loanId/add-document', authorize(Role.Admin), (req, res) => {
    // We want to create a new document in a loan specified by loanId

    db.Loan.findOne({
        _id: req.params.loanId,
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
            let newDocument = new db.Document({
                loanId: req.params.loanId,
                idCard, 
                idNumber,
            });
            newDocument.save().then((newDoc) => {
                res.send({ status: 200, message: "Document created successfully", newDoc });
            })
        } else {
            res.sendStatus(404);
        }
    })
})

/**
 * GET /:loanId/documents/:docId
 * Purpose: Get an existing document
 */
router.get('/:loanId/get-document/:docId', authorize(Role.Admin), (req, res) => {
    // We want to get an existing document (specified by docId)

    db.Loan.findOne({
        _id: req.params.loanId,
    }).then((loan) => {
        if (loan) {
            // loan object with the specified conditions was found
            // therefore the currently authenticated user can get document within this loan
            return true;
        }
        // else - the loan object is undefined
        return false;
    }).then((canUpdateDoc) => {
        if (canUpdateDoc) {
            // the currently authenticated user can get document
            db.Document.findOne({
                _id: req.params.docId,
                loanId: req.params.loanId
            }).then((getDoc) => {
                res.send({ status: 200, message: "Document returned successfully",  getDoc })
            })
        } else {
            res.send({ status: 404, message: "Can't find document" })
        }
    })
});

 /**
 * PATCH /:loanId/documents/:docId
 * Purpose: Get an existing document
 */

router.patch('/:loanId/update-document/:docId', authorize(Role.Admin), (req, res) => {
    // We want to update an existing document (specified by docId)

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
    }).then((canUpdateDoc) => {
        if (canUpdateDoc) {
            // the currently authenticated user can update tasks
            db.Document.findOneAndUpdate({
                _id: req.params.docId,
                loanId: req.params.loanId
            }, {
                    $set: req.body,
                    updated: Date.now()
                }
            ).then((updatedDoc) => {
                res.send({ status: 200, message: 'Document Updated successfully.', updatedDoc })
            })
        } else {
            res.send({status: 404, message:"Can't update document"});
        }
    })
});
 
/**
 * DELETE /:loanId/documents/:docId
 * Purpose: Delete a document by loanId
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
            db.Document.findOneAndRemove({
                _id: req.params.docId,
                loanId: req.params.loanId
            }).then((removedDoc) => {
                res.send({ status: 200, message: 'Document removed successfully', removedDoc });
            })
        } else {
            res.send({ status: 401, message: 'Unable to remove document' });
        }
    });
});



/**
 * STARTS
 * AUTHENTICED USER ROUTES (ADMINS AND USERS)
/**
 
 * POST /loans
 * Purpose: All users Create/Request a loan
 */
router.post('/request', authorize(), (req, res) => {
    // We want to create a new loan and return the new loan document back to the user (which includes the id)
    // The loan information (fields) will be passed in via the JSON request body
    const { loanType, loanAmount, loanStatus } = req.body

    let newLoan = new db.Loan({
        accountId: req.user.id,
        loanType,
        loanAmount,
        loanStatus: Status.Pending
    });
    newLoan.save().then((LoanDoc) => {
        // the full loan document is returned (incl. id)
        res.send({ status: 200, count: LoanDoc.length, message: 'Loan requested successfully', LoanDoc })
    })
});

/**
 * GET /loans
 * Purpose: Authorized user get all loans requested
 */
router.get('/', authorize(), (req, res) => {
    // We want to return an array of all the loans that belong to the authenticated user 
    db.Loan.find({
        accountId: req.user.id,
    }).then((loans) => {
        res.send({ status: 200, message: "Loans returned successfully",  count: loans.length, loans });
    }).catch((e) => {
        res.send(e);
    });
});

/**
 * GET /loan
 * Purpose: Authorized user get a loan
 */
router.get('/:loanId', authorize(), (req, res) => {
    // We want to return an array of all the loans that belong to the authenticated user 
    db.Loan.findOne({
        accountId: req.user.id,
        _id: req.params.loanId
    }).then((loan) => {
        res.send({ status: 200, count: loan.length, loan });
    }).catch((e) => {
        res.send(e);
    });
});

/**
 * POST /:loanId/documents
 * Purpose: Create/Add a document in a specific loan
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

            let newDocument = new db.Document({
                loanId: req.params.loanId,
                idCard, 
                idNumber,
            });
            newDocument.save().then((newDoc) => {
                res.send({ status: 200, message: "Document created successfully", newDoc });
            })
        } else {
            res.send({ status: 404, message: "Unable to create Document" });
        }
    })
});

/**
 * GET /:loanId/documents
 * Purpose: Get all documents in a specific loan
 */
router.get('/:loanId/documents', authorize(), (req, res) => {
    // We want to return all tasks that belong to a specific list (specified by listId)
    db.Document.find({
        loanId: req.params.loanId
    }).populate('loanId').then((documents) => {
        res.send({ status: 200, message: "Documents returned successfully", count: documents.length, documents });
    })
});


/**
 * GET /:loanId/documents/:docId
 * Purpose: Get an existing document
 */
router.get('/:loanId/documents/:docId', authorize(), (req, res) => {
    // We want to get an existing document (specified by docId)

    db.Loan.findOne({
        _id: req.params.loanId,
        accountId: req.user.id
    }).then((loan) => {
        if (loan) {
            // loan object with the specified conditions was found
            // therefore the currently authenticated user can get document within this loan
            return true;
        }
        // else - the loan object is undefined
        return false;
    }).then((canUpdateDoc) => {
        if (canUpdateDoc) {
            // the currently authenticated user can get document
            db.Document.findOne({
                _id: req.params.docId,
                loanId: req.params.loanId
            }).then((getDoc) => {
                res.send({ status: 200, message: 'Document returned successfully', getDoc })
            })
        } else {
            res.send({ status: 404, message: "Can't find document" })
        }
    })
});

/**
 * PATCH /:loanId/documents/:docId
 * Purpose: Update an existing document
 */
router.patch('/:loanId/documents/:docId', authorize(), (req, res) => {
    // We want to update an existing document (specified by docId)

    db.Loan.findOne({
        _id: req.params.loanId,
        accountId: req.user.id
    }).then((loan) => {
        if (loan) {
            // list object with the specified conditions was found
            // therefore the currently authenticated user can make updates to tasks within this list
            return true;
        }

        // else - the list object is undefined
        return false;
    }).then((canUpdateDoc) => {
        if (canUpdateDoc) {
            // the currently authenticated user can update tasks
            db.Document.findOneAndUpdate({
                _id: req.params.docId,
                loanId: req.params.loanId
            }, {
                    $set: req.body,
                    updated: Date.now()
                }
            ).then((updatedDoc) => {
                res.send({ status: 200, message: 'Document Updated successfully.', updatedDoc })
            })
        } else {
            res.send({status: 404, message:"Can't update document"});
        }
    })
});


/* HELPER METHODS */
let deletedocsFromLoan = (loanId) => {
    db.Document.deleteMany({
        loanId
    }).then(() => {
        console.log("Documents from " + loanId + " were deleted!");
    });
}


