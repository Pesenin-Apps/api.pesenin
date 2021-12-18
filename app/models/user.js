const { model, Schema } = require('mongoose');
const bcrypt = require('bcrypt');

const ROLE = {
    CASHIER: 'cashier',
    KITCHEN: 'kitchen',
    WAITER: 'waiter',
    CUSTOMER: 'customer',
}

const HASH_ROUND = 10;

const userSchema = Schema({
    fullname: {
        type: String,
        required: [ true, 'is required.' ],
        maxlength: [ 255, 'cannot exceed 255 characters in length.' ],
        minlength: [ 3, 'must be at least 3 characters in length.' ],
    },
    email: {
        type: String,
        required: [ true, 'is required.' ],
        maxlength: [ 255, 'cannot exceed 255 characters in length.' ],
    },
    password: {
        type: String,
        required: [ true, 'is required.' ],
        maxlength: [ 255, 'cannot exceed 255 characters in length.' ],
    },
    role: {
        type: String, 
        enum: [ 'cashier', 'kitchen', 'waiter', 'customer' ],
        default: 'customer',
    },
    token: [String],
}, { timestamps: true });

// validation for valid email address
userSchema.path('email').validate(function(value) {
    // email regular expression
    const EMAIL_RE = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
    // test email, the result `true` or `false`
    // if true, validation is success
    // if false, validation is fail
    return EMAIL_RE.test(value);
}, attr => `${attr.value} must contain a valid email address.` );

// validation for email already exist
userSchema.path('email').validate(async function(value) {
    try {
        // fetch email form `collection user` by `email`
        const count = await this.model('User').count({ email: value });
        // if user.email was found then return `false`, if user.email not found then return `true`
        // if true, validation is success
        // if false, validation is fail
        return !count;
    } catch (err) {
        throw err;
    }
}, attr => `${attr.value} has been registered`);

// hashing password
userSchema.pre('save', function(next) {
    this.password = bcrypt.hashSync(this.password, HASH_ROUND);
    next();
});

module.exports = {
    ROLE: ROLE,
    User: model('User', userSchema),
}