const mongoose = require('mongoose');

const { 
  dbLocalHost, dbLocalUser, dbLocalPassword, dbLocalPort, dbLocalName,
  dbAtlasUser, dbAtlasPassword, dbAtlasName,
  dbOptionUsed
} = require('../app/config/app');

let uri;

if (dbOptionUsed === 'ATLAS') {
  uri = `mongodb://${dbAtlasUser}:${dbAtlasPassword}@peseninv0-shard-00-00.tcc5y.mongodb.net:27017,peseninv0-shard-00-01.tcc5y.mongodb.net:27017,peseninv0-shard-00-02.tcc5y.mongodb.net:27017/${dbAtlasName}?ssl=true&replicaSet=atlas-14jbaj-shard-0&authSource=admin&retryWrites=true&w=majority`;
} else {
  uri = `mongodb://${dbLocalUser}:${dbLocalPassword}@${dbLocalHost}:${dbLocalPort}/${dbLocalName}?authSource=admin`;
}

const options = {
    useNewUrlParser: true,
    useUnifiedTopology:true,
    useFindAndModify: false,
    useCreateIndex: true
};

// check connections
mongoose.connect(uri, options)
  .then(() => {
      console.info(`MongoDB Connected Successfully!`);
  })
  .catch((error) => {
    throw error;
  });


module.exports = mongoose.connection;