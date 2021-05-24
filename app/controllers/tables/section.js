const TableSection = require('../../models/tables/section');
const { getInitial } = require('../../utils/get-initial');

async function index(req, res, next) {
    try {
        let tableSections = await TableSection.find();
        return res.status(200).json({
            message: "TableSections Retrived Successfully!",
            tableSections: tableSections
        });
    } catch (err) {
        next(err);
    }
}

async function show(req, res, next) {
    try {
        let tableSection = await TableSection.findById(req.params.id);
        return res.status(200).json({
            message: "TableSection Retrived Successfully!",
            tableSection: tableSection
        });
    } catch (err) {
        next(err);
    }
}

async function store(req, res, next) {
    try {
        // request
        let payload = req.body;        
        // store data
        let tableSection = new TableSection(payload);
        tableSection.code = getInitial(payload.name);
        await tableSection.save();
        return res.status(201).json({
            message: 'TableSection Stored Successfully!',
            tableSection: tableSection
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
        // update data
        payload.code  = getInitial(payload.name);
        let tableSection = await TableSection.findOneAndUpdate(
            { _id: req.params.id },
            payload,
            { new: true, runValidators: true}
        );
        res.status(200).json({
            message: 'TableSection Updated Successfully!',
            tableSection: tableSection
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
        let tableSection = await TableSection.findByIdAndDelete({ _id: req.params.id });
        return res.status(200).json({
            message: 'TableSection Deleted Successfully!',
            tableSection: tableSection
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