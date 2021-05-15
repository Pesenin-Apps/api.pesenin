const { ROLE } = require('../models/user');

function me(req, res, next) {
    // if (!req.user) {
    //     return res.status(403).json({
    //         message: 'Your\'re not signin or token expired',
    //     });
    // }
    // console.log(req);
    return res.status(200).json({
        user: req.user,
        token: req.headers.authorization,
        role: ROLE.CASHIER,
    });
}

// TODO: create ENDPOINT for change password for user (cashier, chef, waiter)
async function changePassword(req, res, next) {

}

module.exports = {
    me
}