const mongoose = require('mongoose');
const { dbAtlasUser, dbAtlasPassword, dbAtlasName } = require('../app/config/config');

const uri = `mongodb://${dbAtlasUser}:${dbAtlasPassword}@peseninv0-shard-00-00.tcc5y.mongodb.net:27017,peseninv0-shard-00-01.tcc5y.mongodb.net:27017,peseninv0-shard-00-02.tcc5y.mongodb.net:27017/${dbAtlasName}?ssl=true&replicaSet=atlas-14jbaj-shard-0&authSource=admin&retryWrites=true&w=majority`;
const options = {
    useNewUrlParser: true,
    useUnifiedTopology:true,
    useFindAndModify: false,
    useCreateIndex: true
};

mongoose.connect(uri, options);

const db = mongoose.connection;

module.exports = db;