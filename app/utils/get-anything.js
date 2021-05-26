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
        default:
            option = '';
    }
    return option + '#' + dateNow;
}

module.exports = {
    getInitial,
    getNumbering
}