const mongoose = require('mongoose');
const { model, Schema } = mongoose;

const tableSchema = Schema({
    name: {
        type: String,
        required: [ true, 'is required.' ],
        minlength: [ 3, 'must be at least 3 characters in length.' ]
    },
    number: {
        type: Number,
        required: [ true, 'is required.' ]
    },
    used: {
        type: Boolean,
        default: false
    }
    // TODO: make relationship of section

}, { timestamps: true });

module.exports = model('Table', tableSchema);