// get initial based on `params`, ex: params = `Tiyan Attirmdzi` then return `TA`
function getInitial(str) {
    const initial = str.split(/\s/).reduce((response,word) => response += word.slice(0,1), '');
    return initial;
}