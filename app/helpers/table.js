const { STATUS_TABLE, Table } = require("../models/tables/tabel");

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

async function checkTable(tableId) {
    const table = await Table.findById(tableId);
    switch (table.status) {
        case STATUS_TABLE.USED:
            return res.status(400).json({
                message: 'Table is filled',
            });
        case STATUS_TABLE.RESERVED:
            return res.status(400).json({
                message: 'Table reserved',
            });
        default:
            return true;
    }
}

module.exports = {
    clearTable,
    useTable,
    tableReservation,
    checkTable,
}