const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    rootPath: path.resolve(__dirname, '../../'),
    serviceName: process.env.SERVICE_NAME,
    secretkey: process.env.SECRET_KEY
}