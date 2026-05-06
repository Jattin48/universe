const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['student', 'college'], default: 'student' },
  preferences: {
    course: { type: String, default: '' },
    budget: { type: Number, default: 0 },
    targetCountries: { type: [String], default: [] },
  },
  collegeName: { type: String, default: '' },
  collegeId: { type: Number, default: null },
  status: { type: String, default: 'active' },
}, { timestamps: true });

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
