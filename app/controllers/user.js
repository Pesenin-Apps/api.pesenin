const { ROLE } = require('../models/user');

function me(req, res, next) {
    return res.status(200).json({
        user: req.user
    });
}

// TODO: create ENDPOINT for change password for user (cashier, chef, waiter)
async function changePassword(req, res, next) {

}

module.exports = {
    me
}