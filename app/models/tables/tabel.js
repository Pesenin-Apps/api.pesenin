const { model, Schema } = require('mongoose');

const STATUS = {
    EMPTY: 1,
    USED: 2,
    RESERVED: 3,
}

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
    status: {
        type: Number,
        default: STATUS.EMPTY,
    },
    section: {
        type: Schema.Types.ObjectId,
        ref: 'TableSection',
        required: [ true, 'is required.' ]
    }
}, { timestamps: true });

module.exports = {
    STATUS_TABLE: STATUS,
    Table: model('Table', tableSchema),
}