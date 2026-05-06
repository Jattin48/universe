const bcrypt = require('bcryptjs');
const College = require('./models/College');
const Student = require('./models/Student');
const Message = require('./models/Message');
const User = require('./models/User');
const Application = require('./models/Application');

const defaultColleges = [
  {
    id: 1,
    name: 'Global Tech Institute',
    location: 'California, USA',
    country: 'USA',
    ranking: 12,
    courses: ['Computer Science', 'Data Science', 'Engineering'],
    fees: 45000,
    acceptanceRate: '15%',
    description: 'Leading the world in technological innovation and research.',
    logo: 'GTI',
  },
  {
    id: 2,
    name: 'London Royal College',
    location: 'London, UK',
    country: 'UK',
    ranking: 28,
    courses: ['Business Administration', 'Arts & Design', 'Medicine'],
    fees: 32000,
    acceptanceRate: '22%',
    description: 'A historic institution with a modern approach to global business.',
    logo: 'LRC',
  },
  {
    id: 3,
    name: 'Berlin School of Engineering',
    location: 'Berlin, Germany',
    country: 'Germany',
    ranking: 45,
    courses: ['Engineering', 'Computer Science'],
    fees: 5000,
    acceptanceRate: '30%',
    description: "Tuition-free excellence in the heart of Europe's tech hub.",
    logo: 'BSE',
  },
  {
    id: 4,
    name: 'Sydney Arts Academy',
    location: 'Sydney, Australia',
    country: 'Australia',
    ranking: 67,
    courses: ['Arts & Design', 'Business Administration'],
    fees: 28000,
    acceptanceRate: '45%',
    description: 'Fostering creativity and innovation in the southern hemisphere.',
    logo: 'SAA',
  },
  {
    id: 5,
    name: 'Toronto Med School',
    location: 'Toronto, Canada',
    country: 'Canada',
    ranking: 18,
    courses: ['Medicine', 'Data Science'],
    fees: 38000,
    acceptanceRate: '10%',
    description: 'World-class medical training and research facilities.',
    logo: 'TMS',
  },
];

const defaultStudents = [
  { id: 101, name: 'Alex Johnson', interest: 'Computer Science', grade: '92%', country: 'USA', budget: 50000, status: 'Applied' },
  { id: 102, name: 'Priya Sharma', interest: 'Data Science', grade: '88%', country: 'India', budget: 30000, status: 'Interview' },
  { id: 103, name: 'Maria Garcia', interest: 'Arts & Design', grade: '95%', country: 'Spain', budget: 25000, status: 'Pending' },
];

const defaultMessages = [
  { sender: 'them', recipient: 'student', text: 'Hello! I noticed your profile matches our Engineering program perfectly.', time: '10:30 AM' },
  { sender: 'me', recipient: 'college', text: 'Hi! Thank you. I am very interested in the research opportunities.', time: '10:32 AM' },
  { sender: 'them', recipient: 'student', text: 'Great. We have a virtual open day next week. Would you like to join?', time: '10:33 AM' },
];

const defaultUser = {
  name: 'Alex Doe',
  email: 'alex@example.com',
  passwordHash: bcrypt.hashSync('Password123!', 10),
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  role: 'student',
  preferences: {
    course: 'Computer Science',
    budget: 40000,
    targetCountries: ['USA', 'Canada', 'Germany'],
  },
  collegeName: 'Global Tech Institute',
  collegeId: 1,
};

const defaultApplications = [
  { studentId: 101, collegeId: 1, studentName: 'Alex Johnson', collegeName: 'Global Tech Institute', status: 'Under Review' },
];

const seedDefaultData = async () => {
  if (!(await College.countDocuments())) {
    await College.create(defaultColleges);
  }

  if (!(await Student.countDocuments())) {
    await Student.create(defaultStudents);
  }

  if (!(await Message.countDocuments())) {
    await Message.create(defaultMessages);
  }

  if (!(await User.countDocuments({ email: defaultUser.email }))) {
    await User.create(defaultUser);
  }

  if (!(await Application.countDocuments())) {
    await Application.create(defaultApplications);
  }
};

module.exports = seedDefaultData;
