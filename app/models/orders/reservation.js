const { model, Schema } = require('mongoose');

const STATUS = {
    CREATE: 1,
    CONFIRMED: 2,
}

const SERVING_TYPE = {
    ON_TIME: 1,
    BY_CONFIRMATION: 2,
}

const RESERVATION_CONFIRM = {
    WAITING: 1,
    START_PROCESS: 2,
}

const reservationSchema = Schema({
    order: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
    }, 
    datetime_plan: {
        type: Date,
        required: [ true, 'is required.' ],
    },
    number_of_people: {
        type: Number,
        required: [ true, 'is required.' ],
    },
    status: {
        type: Number,
        default: STATUS.CREATE,
    },
    serving_type: {
        type: Number,
        required: [ true, 'is required.' ],
    },
    reservartion_confirm: {
        type: Number,
        default: null,
    },
});

module.exports = {
    STATUS_RESERVATION: STATUS,
    SERVING_TYPE,
    RESERVATION_CONFIRM,
    Reservation: model('Reservation', reservationSchema)
}