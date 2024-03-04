const mongoose = require('mongoose');

const productItemsSchema = new mongoose.Schema({
  Company_name: {
    type: String,
    required: true
  },
  Invoice_name: {
    type: String,
    required: true
  },
  Unit: {
    type: Number,
    required: true
  },
  Quantity: {
    type: Number,
    required: true
  },
  Amount: {
    type: Number,
    required: true
  },
  // Other fields...
});

const ProductItems = mongoose.model('Product_items', productItemsSchema);

module.exports = ProductItems;
