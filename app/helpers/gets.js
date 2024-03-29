const { Guest } = require('../models/guest');
const { ROLE, User } = require('../models/user');
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

// get guest who checked-in
async function getGuestCheckedIn(checkInNumber) {
    const guest = await Guest.findOne({
        checkin_number: { $in: checkInNumber }
    });
    return guest;
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

function getDateNow() {
    const dateNow = new Date();
    const dateStr = `${
        dateNow.getDate().toString().padStart(2, '0')}-${
        (dateNow.getMonth()+1).toString().padStart(2, '0')}-${
        dateNow.getFullYear().toString().padStart(4, '0')}${' '}${
        dateNow.getHours().toString().padStart(2, '0')}:${
        dateNow.getMinutes().toString().padStart(2, '0')}:${
        dateNow.getSeconds().toString().padStart(2, '0')}
    `;
    return dateStr;
}

// exports all method / module
module.exports = {
    getInitial,
    getNumbering,
    getGuestCheckedIn,
    getUserSignedIn,
    getWaiterReadyToServe,
    getDateNow,
}