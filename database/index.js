const mongoose = require('mongoose');

const { dbHost, dbUser, dbPassword, dbPort, dbName } = require('../app/config/app');

mongoose.connect(`mongodb://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?authSource=admin`, {
    useNewUrlParser: true,
    useUnifiedTopology:true,
    useFindAndModify: false,
    useCreateIndex: true
});

module.exports = mongoose.connection;