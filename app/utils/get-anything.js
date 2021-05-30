const { Customer } = require('../models/customer');

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

function getCustomerCheckedIn(checkin_number) {
    let customer = Customer.findOne({ checkin_number: {$in: checkin_number} });
    return customer;
}

module.exports = {
    getInitial,
    getNumbering,getCustomerCheckedIn
}