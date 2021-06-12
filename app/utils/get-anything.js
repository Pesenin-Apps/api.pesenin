const { Customer } = require('../models/customer');
const { ROLE, User } = require('../models/user');
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

async function getUserSignedIn(userId) {
    let user = await User.findOne({ _id: userId });
    switch (user.role) {
        case ROLE.WAITER:
            let waiter = (await Waiter.findOne({ waiter: user._id })).toJSON();
            user = { ...user.toJSON(), waiter };
            break;
        default:
    }
    return user;
}

async function getWaiterReadyToServe() {
    let waiterIds = [], waiterServed = [];
    let waiter = await Waiter.find({ status: STATUS_WAITER.ON_DUTY });
    waiter.every(element => waiterServed.push(element.served.length));
    let minServe = Math.min.apply(null, waiterServed);
    waiter.forEach(element => {
        if (element.served.length === minServe) {
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

module.exports = {
    getInitial,
    getNumbering,
    getCustomerCheckedIn,
    getUserSignedIn,
    getWaiterReadyToServe
}