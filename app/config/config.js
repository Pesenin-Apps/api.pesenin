const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    rootPath: path.resolve(__dirname, '../../'),
    serviceName: process.env.SERVICE_NAME,
    secretkey: process.env.SECRET_KEY,
    dbOptionUsed: process.env.DB_OPTION,
    dbLocalHost: process.env.DB_LOCAL_HOST,
    dbLocalUser: process.env.DB_LOCAL_USER,
    dbLocalPassword: process.env.DB_LOCAL_PASSWORD,
    dbLocalPort: process.env.DB_LOCAL_PORT,
    dbLocalName: process.env.DB_LOCAL_NAME,
    dbAtlasUser: process.env.DB_ATLAS_USER,
    dbAtlasPassword: process.env.DB_ATLAS_PASSWORD,
    dbAtlasName: process.env.DB_ATLAS_NAME
}