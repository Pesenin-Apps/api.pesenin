const { ROLE, User } = require("../models/user");
const { Waiter } = require("../models/waiter");

async function me(req, res, next) {
    try {
        
        const { user } = req;
        let userData = await User.findById(user._id);

        switch (user.role) {
            case ROLE.WAITER:
                const waiter = (await Waiter.findOne({ waiter: user._id })).toJSON();
                userData = {
                    ...userData.toJSON(),
                    waiter,
                }
                break;
            default:
                break;
        }

        return res.status(200).json({
            message: 'User Retrived Successfully!',
            data: userData,
        });


    } catch (err) {
        next(err);
    }
}

async function changeProfile(req, res, next) {
    try {
        
        const payload = req.body;

        const user = await User.findOneAndUpdate(
            { _id: req.user._id },
            payload,
            { new: false, runValidators: true}
        );

        return res.status(200).json({
            message: 'User ChangeProfile Data Successfully!',
            data: user,
        });

    } catch (err) {
        next(err);
    }
}

async function changePassword(req, res, next) {
    try {

        const { oldpassword, newpassword } = req.body;
        const match = await bcrypt.compare(oldpassword, staff.password);

        if (!match) {
            return res.status(400).json({
                message: 'The Old Password does NOT match!',
            });
        }

        const user = await User.findOneAndUpdate(
            { _id: req.user._id },
            { password: bcrypt.hashSync(newpassword, 10) },
            { new: false, runValidators: true}
        );

        return res.status(200).json({
            message: 'User Change Password Successfully!',
            data: user,
        });

    } catch (err) {
        next(err);
    }
}

async function changeStatusWaiter(req, res, next) {
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
            data: waiter
        });

    } catch (err) {
        next(err);
    }
}

/* =========  R E S O U R C E   R E S T   U S E R S  ========= */

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

async function store(req, res, next) {
    try {
        
        let payload = req.body;
        let user = new User(payload);
        await user.save();

        if (payload.role === ROLE.WAITER) {
            let waiter = new Waiter({
                waiter: user._id
            });
            await waiter.save();
        }

        return res.status(201).json({
            message: 'User Registered Successfully!',
            data: user
        });

    } catch (err) {

        if (err && err.name == 'ValidationError') {
            return res.status(400).json({
                message: err.message,
                fields: err.errors
            });
        }
        next(err);
        
    }
}

async function update(req, res, next) {
    try {

        let dataUpdate = {};
        let { fullname, new_password } = req.body;

        dataUpdate.fullname = fullname;
        if(new_password.length) dataUpdate.password = bcrypt.hashSync(new_password, 10);

        let user = await User.findByIdAndUpdate(
            { _id: req.params.id },
            dataUpdate,
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            message: 'User Updated Successfully!',
            data: user,
        });

    } catch (err) {

        if (err && err.name == 'ValidationError') {
            return res.status(400).json({
                message: err.message,
                fields: err.errors,
            });
        }
        next(err);

    }
}

async function destroy(req, res, next) {
    try {

        let user = await User.findOneAndDelete({ _id: req.params.id });
        await Waiter.findOneAndDelete({ waiter: req.params.id });
        
        return res.status(200).json({
            message: 'User Deleted Successfully!',
            data: user,
        });

    } catch (err) {
        next(err);
    }
}

module.exports = {
    me,
    changeProfile,
    changePassword,
    changeStatusWaiter,
    index,
    show,
    store,
    update,
    destroy,
}