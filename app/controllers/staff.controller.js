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

// TODO : add ENDPOINT for edit personal account staff (cashier, kitchen, waiter) 
async function updateData(req, res, next) {

}

// TODO : add ENDPOINT for change password for staff (cashier, kitchen, waiter)
async function changePassword(req, res, next) {

}

/* =========  [ S T A R T ]  R E S O U R C E  E N D P O I N T  F O R  A L L  U S E R S  ========= */

async function index(req, res, next) {
    try {

        let criteria = {};
        let { page = 1, limit = 10, search = '', role = '' } = req.query;

        if(search.length){
			criteria = {
				...criteria, 
				fullname: {$regex: `${search}`, $options: 'i'},
				email: {$regex: `${search}`, $options: 'i'}
			}
		}

        if (role.length) {
            criteria = {
				...criteria, 
				role: {$regex: `${role}`, $options: 'i'}
			}
        }

        let users = await User.find(criteria)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .sort('fullname');
        let count = await User.find(criteria).countDocuments();

        return res.status(200).json({
            message: "Users Retrived Successfully!",
            count: count,
            pageCurrent: page,
            pageMaximum: Math.ceil(count / limit),
            data: users
        });
        
    } catch (err) {
        next(err);
    }
}

async function show(req, res, next) {
    try {

        let user = await User.findById(req.params.id);

        switch (user.role) {
            case ROLE.WAITER:
                let waiter = (await Waiter.findOne({ waiter: user._id })).toJSON();
                user = { ...user.toJSON(), waiter }
                break;
            default:
        }

        return res.status(200).json({
            message: "User Retrived Successfully!",
            data: user
        });

    } catch (err) {
        next(err);
    }
}

/* =========  [ E N D ]  R E S O U R C E  E N D P O I N T  F O R  A L L  U S E R S  ========= */


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
    updateData,
    changePassword,
    index,
    show,
    // for waiter
    changeStatus
}