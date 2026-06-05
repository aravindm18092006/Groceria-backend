const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: 'c:/Users/ARAVIND M/OneDrive/Desktop/backend mfsd/.env' });

console.log('Connecting to MongoDB Atlas...');

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    console.log('SUCCESS: Connected to MongoDB.');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(col => console.log(` - ${col.name}`));

    // Check if there are any products
    try {
      const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
      const count = await Product.countDocuments();
      console.log(`Total products: ${count}`);
      if (count > 0) {
        const sample = await Product.find().limit(5);
        console.log('Sample products:', JSON.stringify(sample, null, 2));
      }
    } catch (e) {
      console.error('Error fetching products:', e);
    }

    try {
      const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));
      const catCount = await Category.countDocuments();
      console.log(`Total categories: ${catCount}`);
      if (catCount > 0) {
        const sampleCats = await Category.find();
        console.log('Categories:', JSON.stringify(sampleCats, null, 2));
      }
    } catch (e) {
      console.error('Error fetching categories:', e);
    }

    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection failed:', err);
    process.exit(1);
  });
