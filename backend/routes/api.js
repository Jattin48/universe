const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const College = require('../models/College');
const Student = require('../models/Student');
const Message = require('../models/Message');
const User = require('../models/User');
const Application = require('../models/Application');
const auth = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'universe-secret-key';

const calculateMatchScore = (college, preferences) => {
  let score = 60;
  if (college.courses.includes(preferences.course)) score += 20;
  if (college.fees <= preferences.budget) score += 15;
  else if (college.fees <= preferences.budget * 1.2) score += 5;
  if (preferences.targetCountries.includes(college.country)) score += 15;
  return Math.min(score, 99);
};

const COURSES = ['Computer Science', 'Business Administration', 'Engineering', 'Medicine', 'Arts & Design', 'Data Science'];
const COUNTRIES = ['USA', 'UK', 'Canada', 'Germany', 'Australia', 'India', 'Singapore'];

router.get('/status', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role = 'student', preferences = {}, collegeName = '', collegeId = null } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return res.status(409).json({ error: 'Email is already registered.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`;
    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      avatar,
      preferences,
      collegeName,
      collegeId,
    });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.status(201).json({ token, profile: userObj });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Signup failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const validPassword = bcrypt.compareSync(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.json({ token, profile: userObj });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

router.use(auth);

router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.json({ profile: userObj, courses: COURSES, countries: COUNTRIES });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch profile' });
  }
});

router.post('/profile', async (req, res) => {
  try {
    const updates = req.body.preferences || {};
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { preferences: updates, collegeName: req.body.collegeName || req.user.collegeName } },
      { new: true }
    );
    const userObj = updated.toObject();
    delete userObj.passwordHash;
    res.json({ profile: userObj, message: 'Profile updated' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

router.get('/colleges', async (req, res) => {
  try {
    const colleges = await College.find().lean();
    const preferences = req.user?.preferences || { course: '', budget: 0, targetCountries: [] };
    const sorted = colleges
      .map((college) => ({ ...college, matchScore: calculateMatchScore(college, preferences) }))
      .sort((a, b) => b.matchScore - a.matchScore);
    res.json({ colleges: sorted });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch colleges' });
  }
});

router.post('/colleges', async (req, res) => {
  try {
    const data = req.body;
    const nextId = (await College.findOne().sort({ id: -1 }).lean())?.id || 0;
    const college = await College.create({ ...data, id: nextId + 1 });
    const colObj = college.toObject();
    res.status(201).json({ college: colObj });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create college' });
  }
});

router.delete('/colleges/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const college = await College.findOneAndDelete({ id });
    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }
    res.json({ deleted: true, college });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to delete college' });
  }
});

router.get('/students', async (req, res) => {
  try {
    const students = await Student.find().lean();
    res.json({ students });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch students' });
  }
});

router.post('/students', async (req, res) => {
  try {
    const data = req.body;
    const nextId = (await Student.findOne().sort({ id: -1 }).lean())?.id || 100;
    const student = await Student.create({ ...data, id: nextId + 1 });
    const studObj = student.toObject();
    res.status(201).json({ student: studObj });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create student' });
  }
});

router.delete('/students/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const student = await Student.findOneAndDelete({ id });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ deleted: true, student });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to delete student' });
  }
});

router.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 }).lean();
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch messages' });
  }
});

router.post('/messages', async (req, res) => {
  try {
    const { text = '' } = req.body;
    if (!text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }
    const message = await Message.create({
      sender: req.user.email,
      recipient: req.user.role === 'student' ? 'college' : 'student',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    const msgObj = message.toObject();
    res.status(201).json({ message: msgObj });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to send message' });
  }
});

router.delete('/messages/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Message.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ error: 'Message not found' });
    res.json({ deleted: true });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to delete message' });
  }
});

router.get('/applications', async (req, res) => {
  try {
    const applications = await Application.find().lean();
    res.json({ applications });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch applications' });
  }
});

router.post('/apply', async (req, res) => {
  try {
    const { collegeId, studentName, collegeName } = req.body;
    if (!collegeId || !studentName || !collegeName) {
      return res.status(400).json({ error: 'College ID, student name, and college name are required' });
    }
    const studentId = req.user._id.toString();
    const application = await Application.create({ 
      studentId, 
      collegeId, 
      studentName, 
      collegeName, 
      status: 'Under Review' 
    });
    const appObj = application.toObject();
    res.status(201).json({ application: appObj });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to submit application' });
  }
});

router.delete('/applications/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const application = await Application.findByIdAndDelete(id);
    if (!application) return res.status(404).json({ error: 'Application not found' });
    res.json({ deleted: true });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to delete application' });
  }
});

module.exports = router;
