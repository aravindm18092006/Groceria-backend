const mongoose = require('mongoose');
require('dotenv').config();

const email = process.argv[2];
if (!email) {
  console.log('\nError: Please specify an email address.');
  console.log('Usage: node set_admin.js <email>');
  console.log('Example: node set_admin.js aravind@example.com\n');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    console.log('Connecting to MongoDB Atlas...');

    // Schema-less configuration to find & update
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      role: String
    }, { strict: false }));

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log(`\nError: User with email "${email}" was not found in the database.`);
      console.log('Please register the user first on the Groceria website signup page.\n');
      await mongoose.connection.close();
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();
    console.log(`\nSUCCESS: User "${email}" has been successfully promoted to administrator (role: "admin").\n`);

    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
