const { ROLE, User } = require('../models/user');
const { Waiter } = require('../models/waiter');

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

module.exports = {
    me
}