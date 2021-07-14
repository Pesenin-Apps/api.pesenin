const { ROLE, User } = require('../models/user');
const { STATUS_WAITER, Waiter } = require('../models/waiter');

async function me(req, res, next) {

    try {

        const user = req.user;
        let staff = await User.findById(user._id);

        switch (user.role) {
            case ROLE.WAITER:
                let waiter = (await Waiter.findOne({ waiter: user._id })).toJSON();
                staff = { ...staff.toJSON(), waiter }
                break;
            default:
        }

        return res.status(200).json({
            staff: staff
        });

    } catch (err) {
        next(err);
    }

}

/* =========  [ S T A R T ]  F O R  W A I T E R  ========= */

async function changeStatus(req, res, next) {

    try {

        let message;
        let waiter = await Waiter.findOne({ waiter: req.user._id});

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

/* =========  [ E N D ]  F O R  W A I T E R  ========= */

module.exports = {
    me,
    // for waiter
    changeStatus
}