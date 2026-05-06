const mongoose = require('mongoose');

const CollegeSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, index: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  country: { type: String, required: true },
  ranking: { type: Number, required: true },
  courses: { type: [String], default: [] },
  fees: { type: Number, required: true },
  acceptanceRate: { type: String, required: true },
  description: { type: String, default: '' },
  logo: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('College', CollegeSchema);
