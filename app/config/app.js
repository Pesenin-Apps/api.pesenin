const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    rootPath: path.resolve(__dirname, '../../'),
    serviceName: process.env.SERVICE_NAME,
    secretkey: process.env.SECRET_KEY,
    dbHost: process.env.DB_HOST,
    dbUser: process.env.DB_USER,
    dbPassword: process.env.DB_PASSWORD,
    dbPort: process.env.DB_PORT,
    dbName: process.env.DB_NAME,
}