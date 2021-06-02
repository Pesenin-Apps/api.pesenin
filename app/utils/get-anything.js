const { Customer } = require('../models/customer');
const { User } = require('../models/user');
const { STATUS_WAITER, Waiter } = require('../models/waiter');

function getInitial(str) {
    let initial = str.split(/\s/).reduce((response,word)=> response+=word.slice(0,1),'');
    return initial;
}

function getNumbering(options) {
    let option;
    let dateNow = Date.now();
    switch (options) {
        case 'checkin':
            option = 'CHECKIN';
            break;
        case 'order':
            option = 'ORDER';
            break;
        default:
            option = '';
    }
    return option + '#' + dateNow;
}

function getCustomerCheckedIn(checkinNumber) {
    let customer = Customer.findOne({ checkin_number: {$in: checkinNumber} });
    return customer;
}

function getUserSignedIn(userId) {
    let user = User.findOne({ _id: userId });
    return user;
}

async function getWaiterReadyToServe() {
    let waiterIds = [];
    let waiterServed = [];
    let waiter = await Waiter.find({ status: STATUS_WAITER.ON_DUTY });
    waiter.every(element => waiterServed.push(element.served.length));
    let minServe = Math.min.apply(null, waiterServed);
    waiter.forEach(element => {
        if (element.served.length === minServe) {
            waiterIds.push(element._id);
        }
    });
    let waiterElected = waiterIds[Math.floor(Math.random() * waiterIds.length)];
    return waiterElected.toString();
}

module.exports = {
    getInitial,
    getNumbering,
    getCustomerCheckedIn,
    getUserSignedIn,
    getWaiterReadyToServe
}