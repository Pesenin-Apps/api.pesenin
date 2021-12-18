const { Waiter } = require("../models/waiter");

async function waiterServing(waiterId, tableId) {
    await Waiter.findOneAndUpdate(
        { _id: waiterId },
        { $push: { "served": tableId } },
        { useFindAndModify: false }
    );
}

async function waiterUnserve(waiterId, tableId) {
    await Waiter.findOneAndUpdate(
        { _id: waiterId },
        { $pull: { "served": tableId } },
        { useFindAndModify: false }
    );
}

module.exports = {
    waiterServing,
    waiterUnserve,
}