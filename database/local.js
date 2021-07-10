const mongoose = require('mongoose');
const { dbLocalHost, dbLocalUser, dbLocalPassword, dbLocalPort, dbLocalName } = require('../app/config/database');

const uri = `mongodb://${dbLocalUser}:${dbLocalPassword}@${dbLocalHost}:${dbLocalPort}/${dbLocalName}?authSource=admin`;
const options = {
    useNewUrlParser: true,
    useUnifiedTopology:true,
    useFindAndModify: false,
    useCreateIndex: true
};

mongoose.connect(uri, options);

const db = mongoose.connection;

module.exports = db;
