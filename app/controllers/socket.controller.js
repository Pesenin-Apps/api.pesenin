const { Order } = require('../models/orders/order');
const TableSection = require('../models/tables/section');

async function getTables(section) {

    const tableSection = await TableSection.findById(section.toString()).populate({
        path: 'tables',
        options: { sort: { number: 1 } }
    });

    const response = {
        data: tableSection,
    };

    return response;

}

async function getOrderCount() {

    const processed = [1, 2];
    const finished = [3];
    const all = [...processed, ...finished];

    let now = new Date();
    let todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const allData = await Order.find({ status: {$in: all}, createdAt: {$gte: todayDate} }).countDocuments();
    const processedData = await Order.find({ status: {$in: processed}, createdAt: {$gte: todayDate} }).countDocuments();
    const finishedData = await Order.find({ status: {$in: finished}, createdAt: {$gte: todayDate} }).countDocuments();

    const response = {
        all: allData,
        processed: processedData,
        finished: finishedData,
    };

    return response;

}

// async function getOrderItemCount() {
    
//     const inQueue = [2];
//     const inProcess = [3];
//     const finished = [4];
//     const all = [...inQueue, ...inProcess, ...finished];

//     let now = new Date();
//     let todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

//     const allData = await Order.find({ status: {$in: all}, createdAt: {$gte: todayDate} }).countDocuments();
//     const processedData = await Order.find({ status: {$in: processed}, createdAt: {$gte: todayDate} }).countDocuments();
//     const finishedData = await Order.find({ status: {$in: finished}, createdAt: {$gte: todayDate} }).countDocuments();

// }

module.exports = {
    getTables,
    getOrderCount,
}