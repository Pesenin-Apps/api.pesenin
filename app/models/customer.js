const { model, Schema } = require('mongoose');

const STATUS = {
    CHECK_IN: 1,
    CHECK_OUT: 2
}

const customerSchema = Schema({
    name: {
        type: String,
        required: [ true, 'is required.' ],
        minlength: [ 3, 'must be at least 3 characters in length.' ]
    },
    device_detection: {
        type: String,
        required: [ true, 'is required.' ],
        minlength: [ 3, 'must be at least 3 characters in length.' ]
    },
    checkin_number: {
        type: String,
        required: [ true, 'is required.' ],
        minlength: [ 3, 'must be at least 3 characters in length.' ]
    },
    checkin_token: {
        type: String,
        required: [ true, 'is required.' ]
    },
    status: {
        type: Number,
        default: 0
    },
    table: {
        type: Schema.Types.ObjectId,
        ref: 'Table',
        required: [ true, 'is required.' ]
    }
}, { timestamps: true });

module.exports = {
    Customer: model('Customer', customerSchema),
    STATUS: STATUS
}
