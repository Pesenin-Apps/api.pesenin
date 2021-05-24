const Table = require('../../models/tables/tabel');

async function index(req, res, next) {
    try {
        let tables = await Table.find();
        return res.status(200).json({
            message: "Tables Retrived Successfully!",
            tables: tables
        });
    } catch (err) {
        next(error);
    }
}

async function show(req, res, next) {
    try {
        let table = await Table.findById(req.params.id);
        return res.status(200).json({
            message: "Table Retrived Successfully!",
            table: table
        });
    } catch (err) {
        next(err);
    }
}

async function store(req, res, next) {
    try {
        // request
        let payload = req.body;
        // TODO: make relationship of section
        
        // store data
        let table = new Table(payload);
        table.name = payload.number;
        await table.save();
        return res.status(201).json({
            message: 'Table Stored Successfully!',
            table: table
        });
    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return res.status(400).json({
                message: err.message,
                fields: err.errors
            });
        }
        next(err);
    }
}

async function update(req, res, next) {
    try {
        // request 
        let payload = req.body;
        // TODO: make relationship of section

        // check number updated
        if (payload.number) {
            payload.name = payload.number
        }
        // update data
        let table = await Table.findOneAndUpdate(
            { _id: req.params.id },
            payload,
            { new: true, runValidators: true}
        );
        res.status(200).json({
            message: 'Table Updated Successfully!',
            table: table
        });
    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return res.status(400).json({
                message: err.message,
                fields: err.errors
            });
        }
        next(err);
    }
}

async function destroy(req, res, next) {
    try {
        let table = await Table.findByIdAndDelete({ _id: req.params.id });
        return res.status(200).json({
            message: 'Table Deleted Successfully!',
            table: table
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    index,
    show, 
    store,
    update,
    destroy
}