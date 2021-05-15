const jwt = require('jsonwebtoken');

function authorize() {
    return async function(req, res, next) {
        const apiToken = getToken(req);
        if (!apiToken) {
            return res.status(403).json({
                message: 'Sorry, You Unauthorized'
            });
        }
        next();
    }
}