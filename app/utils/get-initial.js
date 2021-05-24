function getInitial(str) {
    let initial = str.split(/\s/).reduce((response,word)=> response+=word.slice(0,1),'');
    return initial;
}

module.exports = {
    getInitial
}