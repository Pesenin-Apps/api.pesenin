const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const User = require('../models/user');
const config = require('../config/app');

async function signUp(req, res, next) {
    try {
        const payload = req.body;
        let user = new User(payload);
        await user.save();
        return res.status(201).json({
            message: 'User Registered Successfully!',
            user: user
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

async function localStrategy(email, password, done) {
    try {
        let user = await User.findOne({ email }).select('-__v -createdAt -updatedAt -token');
        if (!user) return done();
        if (bcrypt.compareSync(password, user.password)) {
            ( { password, ...userWithoutPassword } = user.toJSON() );
        }
        return done(null, userWithoutPassword);
    } catch (err) {
        done(err, null);
    }
    done();
}

async function signIn(req, res, next) {
    passport.authenticate('local', async function(err, user) {
        if (err) return next(err);
        if (!user) return res.status(403).json({
            message: 'email or password incorrect'
        });
        let signed = jwt.sign(user, config.secretkey);
        await User.findOneAndUpdate(
            { _id: user._id },
            { $push: {token: signed } },
            { new: true }
        );
        return res.status(200).json({
            message: 'Signed In Successfully!',
            user: user,
            token: signed
        });
    })(req, res, next);
}

function me(req, res, next) {
    if (!req.user) {
        return res.status(403).json({
            message: 'Your\'re not signin or token expired'
        });
    }
    return res.json(req.user);
}

module.exports = {
    signUp,
    localStrategy,
    signIn,
    me
}