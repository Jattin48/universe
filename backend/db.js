const mongoose = require('mongoose');
const seedDefaultData = require('./seed');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universe';

const connectDatabase = async () => {
  mongoose.set('strictQuery', false);
  await mongoose.connect(MONGODB_URI);
  await seedDefaultData();
  return mongoose.connection;
};

module.exports = connectDatabase;
