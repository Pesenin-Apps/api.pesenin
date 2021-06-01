const { Customer } = require('../models/customer');
const { User } = require('../models/user');

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

module.exports = {
    getInitial,
    getNumbering,
    getCustomerCheckedIn,
    getUserSignedIn
}