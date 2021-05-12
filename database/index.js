const mongoose = require('mongoose');

const { dbHost, dbUser, dbPassword, dbPort, dbName, mDBuser, mDBpassword, mDBname } = require('../app/config/app');

// mongoose.connect(`mongodb://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?authSource=admin`, {
//     useNewUrlParser: true,
//     useUnifiedTopology:true,
//     useFindAndModify: false,
//     useCreateIndex: true
// });

const uri = `mongodb://${mDBuser}:${mDBpassword}@pesenin-shard-00-00.xsgm8.mongodb.net:27017,pesenin-shard-00-01.xsgm8.mongodb.net:27017,pesenin-shard-00-02.xsgm8.mongodb.net:27017/${mDBname}?ssl=true&replicaSet=atlas-14jbaj-shard-0&authSource=admin&retryWrites=true&w=majority`;
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


// module.exports = mongoose.connection;