const { ROLE, User } = require('../models/user');
const { STATUS_WAITER,Waiter } = require('../models/waiter');

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

/* ========= FOR WAITER ========= */
async function changeStatus(req, res, next) {
    try {
        let message;
        let waiter = await Waiter.findOne({ waiter: req.user._id });
        if (waiter.status === STATUS_WAITER.OFF_DUTY) {
            waiter.status = STATUS_WAITER.ON_DUTY;
            message = 'Now, You\'re On Duty';
        } else {
            waiter.status = STATUS_WAITER.OFF_DUTY;
            message = 'Now, You\'re Off Duty';
        }
        await waiter.save();
        return res.status(200).json({
            message: message,
            waiter: waiter
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    me,
    changeStatus
}