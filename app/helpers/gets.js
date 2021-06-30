const { Customer } = require('../models/customer')

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