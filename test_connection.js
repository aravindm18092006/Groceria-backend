const mongoose = require('mongoose');
require('dotenv').config();

console.log('Attempting to connect to MongoDB Atlas...');
console.log('URL:', process.env.MONGO_URL);

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    console.log('SUCCESS: Connected to MongoDB Atlas successfully.');

    // Check if we can access the 'users' collection
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections in database:');
    collections.forEach(col => console.log(` - ${col.name}`));

    // Retrieve count of documents in the users collection if it exists
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const count = await User.countDocuments();
    console.log(`Total users registered in the database: ${count}`);

    // Fetch a sample user (omitting password for privacy)
    if (count > 0) {
      const sample = await User.findOne({}, { password: 0 });
      console.log('Sample registered user (first entry):', sample);
    }

    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  })
  .catch(err => {
    console.error('FAILURE: Could not connect to MongoDB Atlas.');
    console.error(err);
    process.exit(1);
  });
