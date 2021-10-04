const Table = require('../../models/tables/tabel');
const TableSection = require('../../models/tables/section');

async function index(req, res, next) {
    try {

        let tables = await Table.find().populate('section', 'name');
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

        let table = await Table.findById(req.params.id).populate('section', 'name');
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
        let code;
        let payload = req.body;

        const existTable = await Table.findOne({
            'number': payload.number
        }).populate({
            path: 'section',
            match: {
                _id: payload.section
            }
        });
        
        if (existTable.section != null) {
            return res.status(400).json({
                message: 'Table Already Exist!'
            });
        }

        // relationship of section
        if (payload.section) {
            let section = await TableSection.findOne({ 
                _id: payload.section
            });
            if (section) {
                payload = { ...payload, section: section._id }
                code = section.code
            } else {
                delete payload.section
            }
        }

        // store data
        let table = new Table(payload);
        table.name = code + '-' + payload.number;
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
        let code;
        let payload = req.body;

        // relationship of section
        if (payload.section) {
            let section = await TableSection.findOne({ 
                _id: payload.section
            });
            if (section) {
                payload = { ...payload, section: section._id }
                code = section.code
            } else {
                delete payload.section
            }
        }

        // check number updated
        if (payload.number || payload.section) {
            payload.name = code + '-' + payload.number
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