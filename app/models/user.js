const mongoose = require('mongoose');
const { model, Schema } = mongoose;

const userSchema = Schema({
    fullname: {
        type: String,
        required: [ true, 'Nama harus diisi' ],
        maxlength: [ 255, 'Panjang nama harus antara 3 - 255 karakter' ],
        minlength: [ 3, 'Panjang nama harus antara 3 - 255 karakter' ]
    },
    email: {
        type: String,
        required: [ true, 'Email harus diisi' ],
        maxlength: [255, 'Panjang email maksimal 255 karakter'],
    },
    password: {
        type: String,
        required: [true, 'Password harus diisi'],
        maxlength: [255, 'Panjang password maksimal 255 karakter'],
    },
    role: {
        type: String, 
        enum: ['cashier', 'chef', 'waiter'],
        default: 'waiter'
    },
    token: [String]
}, { timestamps: true });

module.exports = model('User', userSchema);