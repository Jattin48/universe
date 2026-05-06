const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  collegeId: { type: Number, required: true, index: true },
  studentName: { type: String, default: '' },
  collegeName: { type: String, default: '' },
  status: { type: String, default: 'Under Review' },
  appliedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Application', ApplicationSchema);
