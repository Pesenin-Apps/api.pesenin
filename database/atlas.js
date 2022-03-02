const mongoose = require('mongoose');
const { dbAtlasUser, dbAtlasPassword, dbAtlasName, dbAtlasQueryString, dbAtlasOption } = require('../app/config/database');

const uri = `mongodb://${dbAtlasUser}:${dbAtlasPassword}@${dbAtlasQueryString}/${dbAtlasName}?${dbAtlasOption}`;
const options = {
    useNewUrlParser: true,
    useUnifiedTopology:true,
    useFindAndModify: false,
    useCreateIndex: true
};

mongoose.connect(uri, options);

const db = mongoose.connection;

module.exports = db;