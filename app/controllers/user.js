const { ROLE, User } = require('../models/user');
const { Waiter } = require('../models/waiter');

async function me(req, res, next) {
    let user = await User.findById(req.user._id);
    switch (req.user.role) {
        case ROLE.WAITER:
            let waiter = (await Waiter.findOne({ waiter: req.user._id })).toJSON();
            user = { ...user.toJSON(), waiter };
            break;
        default:
    }
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