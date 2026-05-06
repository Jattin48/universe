const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, index: true },
  name: { type: String, required: true },
  interest: { type: String, required: true },
  grade: { type: String, default: '' },
  country: { type: String, required: true },
  budget: { type: Number, required: true },
  status: { type: String, default: 'Pending' },
}, { timestamps: true });

module.exports = mongoose.model('Student', StudentSchema);
