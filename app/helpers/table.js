const { Table, STATUS_TABLE } = require("../models/tables/tabel");


async function clearTable(tableId) {
    await Table.findOneAndUpdate(
        { _id: tableId },
        { status: STATUS_TABLE.EMPTY },
        { useFindAndModify: false },
    );
}

async function useTable(tableId) {
    await Table.findOneAndUpdate(
        { _id: tableId },
        { status: STATUS_TABLE.USED },
        { useFindAndModify: false },
    );
}

async function tableReservation(tableId) {
    await Table.findOneAndUpdate(
        { _id: tableId },
        { status: STATUS_TABLE.RESERVED },
        { useFindAndModify: false },
    );
}


module.exports = {
    clearTable,
    useTable,
    tableReservation,
}