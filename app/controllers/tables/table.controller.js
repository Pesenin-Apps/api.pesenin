const { Table } = require('../../models/tables/tabel');
const TableSection = require('../../models/tables/section');

async function index(req, res, next) {
    try {

        let tables = await Table.find().populate('section', 'name').sort('section number');
        return res.status(200).json({
            message: "Tables Retrived Successfully!",
            data: tables
        });

    } catch (err) {
        next(err);
    }
}

async function show(req, res, next) {
    try {

        let table = await Table.findById(req.params.id).populate('section', 'name');
        return res.status(200).json({
            message: "Table Retrived Successfully!",
            data: table
        });

    } catch (err) {
        if (err && err.kind === 'ObjectId') {
            return res.status(404).json({
                message: "Kode bukan bagian dari Pesenin App!",
            });
        }
        next(err);
    }
}

async function store(req, res, next) {
    try {

        // request
        let code;
        let payload = req.body;

        const sectionExists = await TableSection.findById(payload.section).populate({
            path: 'tables',
            match: {
                number: payload.number
            },
        });

        if (sectionExists.tables.length > 0) {
            return res.status(400).json({
                message: 'Meja telah tersedia!'
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
            data: table
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
            data: table
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
            data: table
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