const { Guest, STATUS_GUEST } = require("../models/guest");

async function guestCheckOut(token) {
    await Guest.findOneAndUpdate(
        { checkin_token: token },
        { status: STATUS_GUEST.CHECK_OUT },
        { useFindAndModify: false },
    );
}

module.exports = guestCheckOut;