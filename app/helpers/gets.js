const { Customer } = require('../models/customer');
const { User, ROLE } = require('../models/user');
const { STATUS_WAITER, Waiter } = require('../models/waiter');

// get initial based on `params`, ex: params = `Tiyan Attirmdzi` then return `TA`
function getInitial(str) {
    const initial = str.split(/\s/).reduce((response,word) => response += word.slice(0,1), '');
    return initial;
}

// get numbering unique
function getNumbering(options) {
    let strOption;
    let dateNow = Date.now();
    switch (options) {
        case 'checkin':
            strOption = 'CHECKIN';
            break;
        case 'order':
            strOption = 'ORDER';
            break;
        default:
            strOption = 'NUMBER';
    }
    return strOption + '#' + dateNow;
}

// get customer who checked in
async function getCustomerCheckedIn(checkInNumber) {
    const customer = await Customer.findOne({ checkin_number: {$in: checkInNumber} });
    return customer;
}

// get user who signed in
async function getUserSignedIn(id) {
    let user = await User.findOne({ _id: id });
    switch (user.role) {
        case ROLE.WAITER:
            let waiter = (await Waiter.findOne({ waiter: user._id})).toJSON();
            user = { ...user.toJSON(), waiter };
            break;
        default: // do nothing
            break;
    }
    return user;
}

// TODO: look for more efficient code
// get a waiter who is ready to serve
async function getWaiterReadyToServe() {
    let waiterIds = [], countServed = [];
    const waiter = await Waiter.find({ status: STATUS_WAITER.ON_DUTY });
    waiter.every(element => countServed.push(element.served.length));
    const smallestServe = Math.min.apply(null, countServed);

    waiter.forEach(element => {
        if (element.served.length === smallestServe) {
            waiterIds.push(element._id);
        }
    });

    let waiterElected = waiterIds[Math.floor(Math.random() * waiterIds.length)];
    
    if (waiterElected) {
        return waiterElected.toString();
    } else {
        return false;
    }
}

// exports all method / module
module.exports = {
    getInitial,
    getNumbering,
    getCustomerCheckedIn,
    getUserSignedIn,
    getWaiterReadyToServe
}