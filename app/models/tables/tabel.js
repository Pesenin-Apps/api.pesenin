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
    },
    section: {
        type: Schema.Types.ObjectId,
        ref: 'TableSection',
        required: [ true, 'is required.' ]
    }
}, { timestamps: true });

module.exports = model('Table', tableSchema);