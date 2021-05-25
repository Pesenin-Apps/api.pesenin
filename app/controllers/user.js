const { ROLE, User } = require('../models/user');

async function me(req, res, next) {
    let user = await User.findById(req.user._id);
    return res.status(200).json({
        message: 'MyData Retrived Successfully!',
        user: user
    });
}

// TODO: create ENDPOINT for change password for user (cashier, chef, waiter)
async function changePassword(req, res, next) {

}

module.exports = {
    me
}