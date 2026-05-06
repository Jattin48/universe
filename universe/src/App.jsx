/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';
import * as api from './api';
import { 
  BookOpen, Users, MessageSquare, Settings, LogOut, Search, 
  MapPin, DollarSign, Award, Briefcase, CheckCircle, XCircle, 
  Send, User, Building2, TrendingUp, Globe, Star, Menu, X 
} from 'lucide-react';

// --- MOCK DATA ---
const COURSES = ["Computer Science", "Business Administration", "Engineering", "Medicine", "Arts & Design", "Data Science"];
const COUNTRIES = ["USA", "UK", "Canada", "Germany", "Australia", "India", "Singapore"];

const MOCK_COLLEGES = [
  { id: 1, name: "Global Tech Institute", location: "California, USA", country: "USA", ranking: 12, courses: ["Computer Science", "Data Science", "Engineering"], fees: 45000, acceptanceRate: "15%", description: "Leading the world in technological innovation and research.", logo: "GTI" },
  { id: 2, name: "London Royal College", location: "London, UK", country: "UK", ranking: 28, courses: ["Business Administration", "Arts & Design", "Medicine"], fees: 32000, acceptanceRate: "22%", description: "A historic institution with a modern approach to global business.", logo: "LRC" },
  { id: 3, name: "Berlin School of Engineering", location: "Berlin, Germany", country: "Germany", ranking: 45, courses: ["Engineering", "Computer Science"], fees: 5000, acceptanceRate: "30%", description: "Tuition-free excellence in the heart of Europe's tech hub.", logo: "BSE" },
  { id: 4, name: "Sydney Arts Academy", location: "Sydney, Australia", country: "Australia", ranking: 67, courses: ["Arts & Design", "Business Administration"], fees: 28000, acceptanceRate: "45%", description: "Fostering creativity and innovation in the southern hemisphere.", logo: "SAA" },
  { id: 5, name: "Toronto Med School", location: "Toronto, Canada", country: "Canada", ranking: 18, courses: ["Medicine", "Data Science"], fees: 38000, acceptanceRate: "10%", description: "World-class medical training and research facilities.", logo: "TMS" },
];

const MOCK_STUDENTS = [
  { id: 101, name: "Alex Johnson", interest: "Computer Science", grade: "92%", country: "USA", budget: 50000, status: "Applied" },
  { id: 102, name: "Priya Sharma", interest: "Data Science", grade: "88%", country: "India", budget: 30000, status: "Interview" },
  { id: 103, name: "Maria Garcia", interest: "Arts & Design", grade: "95%", country: "Spain", budget: 25000, status: "Pending" },
];

const MOCK_MESSAGES = [
  { id: 1, sender: 'them', text: 'Hello! I noticed your profile matches our Engineering program perfectly.', time: '10:30 AM' },
  { id: 2, sender: 'me', text: 'Hi! Thank you. I am very interested in the research opportunities.', time: '10:32 AM' },
  { id: 3, sender: 'them', text: 'Great. We have a virtual open day next week. Would you like to join?', time: '10:33 AM' },
];

// --- UTILITY COMPONENTS ---
const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => (
  <button onClick={onClick} className={`btn btn-${variant} ${className}`} {...props}>
    {children}
  </button>
);

const Card = ({ children, className = '' }) => <div className={`card ${className}`}>{children}</div>;
const Badge = ({ children, color = 'indigo' }) => <span className={`badge badge-${color}`}>{children}</span>;

const calculateMatchScore = (college, preferences) => {
  let score = 60;
  if (college.courses.includes(preferences.course)) score += 20;
  if (college.fees <= preferences.budget) score += 15;
  else if (college.fees <= preferences.budget * 1.2) score += 5;
  if (preferences.targetCountries.includes(college.country)) score += 15;
  return Math.min(score, 99);
};

// --- INTRO LOADER COMPONENT ---
// (Defined outside App, so it's safe to use as <IntroLoader />)
const IntroLoader = ({ onComplete }) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 6500);

    const removeTimer = setTimeout(() => {
      onComplete();
    }, 7300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`intro-screen ${isFading ? 'fade-out' : ''}`}>
      <div className="loader-rings"></div>
      <div className="loading-text">Initializing Universe</div>
      <div className="progress-container">
        <div className="progress-fill"></div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [view, setView] = useState('landing');
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [notification, setNotification] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [authError, setAuthError] = useState('');

  const [userProfile, setUserProfile] = useState({
    name: 'Guest',
    email: '',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
    preferences: { course: 'Computer Science', budget: 40000, targetCountries: ['USA', 'Canada', 'Germany'] },
    collegeName: '',
    collegeId: null,
  });
  const [colleges, setColleges] = useState(MOCK_COLLEGES);
  const [students, setStudents] = useState(MOCK_STUDENTS);
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [courses, setCourses] = useState(COURSES);
  const [countries, setCountries] = useState(COUNTRIES);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const initializeSession = async () => {
      const token = localStorage.getItem('UNIVERSE_AUTH_TOKEN');
      if (!token) return;

      setLoading(true);
      try {
        const profileResponse = await api.getProfile();
        setUserProfile(profileResponse.profile);
        setUserRole(profileResponse.profile.role);
        setView('dashboard');
        await loadData();
      } catch (error) {
        localStorage.removeItem('UNIVERSE_AUTH_TOKEN');
        setView('auth');
        console.error('Session restore failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const profileResponse = await api.getProfile();
      const collegeResponse = await api.fetchColleges();
      const studentResponse = await api.fetchStudents();
      const messageResponse = await api.fetchMessages();
      const applicationsResponse = await api.fetchApplications();

      setUserProfile(profileResponse.profile);
      setCourses(profileResponse.courses || COURSES);
      setColleges(collegeResponse.colleges);
      setStudents(studentResponse.students);
      setMessages(messageResponse.messages);
      setApplications(applicationsResponse.applications);
    } catch (error) {
      showNotification('Unable to connect to backend. Using local mock data.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const matchedColleges = useMemo(() => {
    return colleges.map((college) => ({
      ...college,
      matchScore: calculateMatchScore(college, userProfile.preferences),
    })).sort((a, b) => b.matchScore - a.matchScore);
  }, [colleges, userProfile.preferences]);

  const handleAuthSubmit = async (e) => {
    e?.preventDefault();
    setAuthError('');

    if (!authForm.email || !authForm.password || (authMode === 'signup' && !authForm.name)) {
      setAuthError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: authForm.name,
        email: authForm.email,
        password: authForm.password,
        role: authForm.role,
      };

      const response = authMode === 'signup'
        ? await api.signup(payload)
        : await api.login(authForm.email, authForm.password);

      localStorage.setItem('UNIVERSE_AUTH_TOKEN', response.token);
      
      setUserProfile(response?.profile || { 
        name: authForm.name || 'User',
        preferences: { course: 'Computer Science', budget: 40000, targetCountries: ['USA'] }
      });
      setUserRole(response?.profile?.role || authForm.role);
      
      setView('dashboard');
      setActiveTab('home');
      await loadData();
      return; 
    } catch (error) {
      setAuthError(error.message || 'Authentication failed');
      console.error(error);
    } 
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('UNIVERSE_AUTH_TOKEN');
    setUserRole(null);
    setView('landing');
    setAuthForm({ name: '', email: '', password: '', role: 'student' });
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveProfile = async () => {
    try {
      const response = await api.updateProfile(userProfile.preferences);
      setUserProfile(response.profile);
      showNotification('Profile updated successfully');
    } catch (error) {
      showNotification('Unable to save profile');
      console.error(error);
    }
  };

  const handleApply = async (college) => {
    try {
      await api.applyCollege({
        collegeId: college.id,
        studentName: userProfile.name,
        collegeName: college.name,
      });
      showNotification(`Application started for ${college.name}`);
      loadData();
    } catch (error) {
      showNotification('Application failed');
      console.error(error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const response = await api.createMessage({ text: newMessage.trim() });
      setMessages((prev) => [...prev, response.message]);
      setNewMessage('');
    } catch (error) {
      showNotification('Message send failed');
      console.error(error);
    }
  };

  const handleDeleteMessage = async (id) => {
    try {
      await api.deleteMessage(id);
      setMessages((prev) => prev.filter((message) => message._id !== id && message.id !== id));
      showNotification('Message deleted');
    } catch (error) {
      showNotification('Delete failed');
      console.error(error);
    }
  };

  // --- INTERNAL RENDER FUNCTIONS (No longer treated as React Components) ---
  
  const LandingPage = () => (
    <div className="landing-container animate-in">
      <nav className="navbar max-width-container">
        <div className="logo-group">
          <div className="logo-icon">U</div>
          <span className="logo-text">Universe</span>
        </div>
        <div className="nav-links desktop-only">
          <a href="#about">About</a>
          <a href="#colleges">Colleges</a>
          <a href="#students">Students</a>
        </div>
        <div className="nav-actions">
          <button onClick={() => setView('auth')} className="btn-text">Log In</button>
          <button onClick={() => setView('auth')} className="btn btn-primary btn-rounded">Get Started</button>
        </div>
      </nav>

      <div className="hero-section max-width-container">
        <div className="hero-content">
          <Badge color="indigo">Global Education Connect</Badge>
          <h1 className="hero-title">
            Find Your Place in the <span className="text-gradient">Universe</span>
          </h1>
          <p className="hero-desc">
            The AI-powered bridge between aspiring students and world-class institutions. No barriers. Just opportunities.
          </p>
          <div className="hero-buttons">
            <button onClick={() => { setAuthMode('login'); setAuthForm((prev) => ({ ...prev, role: 'student' })); setView('auth'); }} className="btn btn-white btn-lg">I'm a Student</button>
            <button onClick={() => { setAuthMode('login'); setAuthForm((prev) => ({ ...prev, role: 'college' })); setView('auth'); }} className="btn btn-glass btn-lg">I Represent a College</button>
          </div>
          <div className="hero-features">
            <div className="feature-item"><CheckCircle size={16} className="text-success" /> AI Recommendations</div>
            <div className="feature-item"><CheckCircle size={16} className="text-success" /> Direct Chat</div>
            <div className="feature-item"><CheckCircle size={16} className="text-success" /> Global Reach</div>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="visual-glow"></div>
          <div className="match-card-preview">
            <div className="match-header">
              <div className="match-info">
                <div className="match-logo">GT</div>
                <div>
                  <h3 className="match-name">Global Tech Institute</h3>
                  <p className="match-loc">California, USA</p>
                </div>
              </div>
              <div className="match-score-box">
                <div className="score-val text-success">98%</div>
                <div className="score-label">Match Score</div>
              </div>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill-static" style={{width: '98%', height: '100%', background: 'var(--success)', borderRadius: '3px'}}></div>
            </div>
            <div className="match-details">
              <div className="detail-row">
                <span>Course</span>
                <span className="detail-val"><CheckCircle size={14} className="text-success"/> Computer Science</span>
              </div>
              <div className="detail-row">
                <span>Budget</span>
                <span className="detail-val"><CheckCircle size={14} className="text-success"/> Within Range</span>
              </div>
            </div>
            <div className="match-actions">
               <button className="btn btn-primary flex-1">Apply Now</button>
               <button className="btn btn-icon"><MessageSquare size={18}/></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const AuthScreen = () => (
    <div className="auth-container animate-in">
      <Card className="auth-card auth-card-form">
        <div className="auth-header">
          <div className="logo-icon-lg">U</div>
          <h2 className="auth-title">Welcome to Universe</h2>
          <p className="auth-subtitle">{authMode === 'signup' ? 'Create a new account' : 'Log in to your account'}</p>
        </div>

        <div className="auth-toggle-row">
          <button 
            className={`auth-toggle ${authMode === 'login' ? 'active' : ''}`} 
            onClick={() => { setAuthMode('login'); setAuthError(''); }}
          >
            Log In
          </button>
          <button 
            className={`auth-toggle ${authMode === 'signup' ? 'active' : ''}`} 
            onClick={() => { setAuthMode('signup'); setAuthError(''); }}
          >
            Sign Up
          </button>
        </div>

        <form className="auth-form" onSubmit={handleAuthSubmit}>
          {authMode === 'signup' && (
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={authForm.name}
                onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                placeholder="Jane Doe"
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              placeholder="Enter your password"
            />
          </div>

          {authMode === 'signup' && (
            <div className="form-group">
              <label>Portal</label>
              <select value={authForm.role} onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}>
                <option value="student">Student</option>
                <option value="college">College</option>
              </select>
            </div>
          )}

          {authError && <div className="form-error">{authError}</div>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Working...' : authMode === 'signup' ? 'Create account' : 'Log in'}
            </button>
          </div>
        </form>

        <div className="auth-footer">
          <button onClick={() => setView('landing')} className="btn-link">Back to Home</button>
        </div>
      </Card>
    </div>
  );

  const NavItem = ({ icon, label, id }) => (
    <button 
      onClick={() => { setActiveTab(id); setMobileMenuOpen(false); }}
      className={`nav-item ${activeTab === id ? 'active' : ''}`}
    >
      {React.cloneElement(icon, { size: 20 })}
      {label}
    </button>
  );

  const Sidebar = () => (
    <div className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
         <div className="logo-group">
           <div className="logo-icon-sm">U</div>
           Universe
         </div>
         <button className="mobile-close-btn" onClick={() => setMobileMenuOpen(false)}><X size={24}/></button>
      </div>

      <div className="sidebar-content">
        <div className="user-info">
          <img src={userProfile.avatar} alt="Profile" className="user-avatar" />
          <div className="user-details">
            <p className="user-name">{userProfile.name}</p>
            <p className="user-role">{userRole}</p>
          </div>
        </div>

        <nav className="nav-menu">
          {userRole === 'student' ? (
            <>
              {NavItem({ icon: <Search />, label: "Find Colleges", id: "home" })}
              {NavItem({ icon: <MessageSquare />, label: "Messages", id: "messages" })}
              {NavItem({ icon: <Briefcase />, label: "Applications", id: "applications" })}
              {NavItem({ icon: <User />, label: "My Profile", id: "profile" })}
            </>
          ) : (
            <>
              {NavItem({ icon: <TrendingUp />, label: "Dashboard", id: "home" })}
              {NavItem({ icon: <Users />, label: "Student Search", id: "students" })}
              {NavItem({ icon: <MessageSquare />, label: "Messages", id: "messages" })}
              {NavItem({ icon: <Settings />, label: "Settings", id: "settings" })}
            </>
          )}
        </nav>
      </div>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="btn-logout"><LogOut size={20} /><span>Sign Out</span></button>
      </div>
    </div>
  );

  const ChatView = () => (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-list-header">Conversations</div>
        <div className="chat-list">
          {messages.slice(-3).map((msg, index) => (
            <div key={msg._id || msg.id || index} className="chat-item">
              <div className="chat-avatar">{msg.sender === 'me' ? 'ME' : 'AO'}</div>
              <div className="chat-info">
                <h4 className="chat-name">{msg.sender === 'me' ? 'You' : 'Universe Bot'}</h4>
                <p className="chat-preview">{msg.text.slice(0, 30)}...</p>
              </div>
              <span className="chat-time">{msg.time}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="chat-main">
        <div className="chat-header">
           <div className="chat-header-user">
             <div className="chat-header-avatar">AO</div>
             <span className="chat-header-name">{userRole === 'student' ? 'Global Tech Admissions' : 'Alex Johnson'}</span>
           </div>
           <Button variant="ghost" className="btn-sm"><Settings size={16}/></Button>
        </div>
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg._id || msg.id} className={`message-row ${msg.sender === 'me' ? 'message-right' : 'message-left'}`}>
              <div className={`message-bubble ${msg.sender === 'me' ? 'bubble-primary' : 'bubble-white'}`}>
                {msg.text}
                {msg._id && (
                  <button className="message-delete" onClick={() => handleDeleteMessage(msg._id)}>×</button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="chat-input-area">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            type="text"
            placeholder="Type a message..."
            className="chat-input"
          />
          <Button onClick={handleSendMessage}><Send size={18}/></Button>
        </div>
      </div>
    </div>
  );

  const StudentHome = () => (
    <div className="student-home animate-in">
      <Card className="matcher-card">
        <div className="matcher-content">
          <div>
            <h2 className="matcher-title">My Education Matcher</h2>
            <div className="matcher-tags">
               <span className="matcher-tag"><BookOpen size={14}/> {userProfile.preferences.course}</span>
               <span className="matcher-tag"><Globe size={14}/> {userProfile.preferences.targetCountries.join(", ")}</span>
               <span className="matcher-tag"><DollarSign size={14}/> &lt; ${userProfile.preferences.budget/1000}k</span>
            </div>
          </div>
          <div className="matcher-stats">
             <div className="match-count text-success">{matchedColleges.filter(c => c.matchScore > 80).length}</div>
             <div className="match-label">Top Matches Found</div>
          </div>
        </div>
      </Card>
      <div className="college-grid">
        {matchedColleges.map((college) => (
          <Card key={college.id} className="college-card group">
            <div className="college-header-img">
               <div className="overlay group-hover"></div>
               <div className="rank-badge">#{college.ranking} Global Rank</div>
               <div className="college-logo-float">{college.logo}</div>
            </div>
            <div className="college-body">
              <div className="college-title-row">
                <h3 className="college-name">{college.name}</h3>
                <div className="match-indicator">
                   <span className={`match-val ${college.matchScore > 80 ? 'text-success' : 'text-warning'}`}>{college.matchScore}%</span>
                   <span className="match-sub">Match</span>
                </div>
              </div>
              <div className="college-loc"><MapPin size={14} className="icon-inline" /> {college.location}</div>
              <p className="college-desc">{college.description}</p>
              <div className="college-stats">
                 <div className="stat-row"><span className="stat-label">Fees</span><span className="stat-val">${college.fees.toLocaleString()}/yr</span></div>
                 <div className="stat-row"><span className="stat-label">Acceptance</span><span className="stat-val">{college.acceptanceRate}</span></div>
              </div>
              <div className="college-actions">
                <Button variant="outline" className="btn-sm flex-1" onClick={() => setActiveTab('messages')}>Chat</Button>
                <Button className="btn-sm flex-1" onClick={() => handleApply(college)}>Apply</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const StudentProfile = () => (
    <div className="profile-container animate-in">
       <Card className="profile-card">
         <h3 className="section-title"><User size={20}/> Academic Profile</h3>
         <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={userProfile.name} readOnly />
            </div>
            <div className="form-group">
              <label>Previous Grade/GPA</label>
              <input type="text" value="3.8 / 4.0" readOnly />
            </div>
            <div className="form-group full-width">
               <label>Interested Course</label>
               <select value={userProfile.preferences.course} onChange={(e) => setUserProfile({...userProfile, preferences: {...userProfile.preferences, course: e.target.value}})}>
                 {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
            </div>
            <div className="form-group full-width">
              <label>Max Budget (USD/Year)</label>
              <div className="range-group">
                <input type="range" min="5000" max="100000" step="5000" value={userProfile.preferences.budget} onChange={(e) => setUserProfile({...userProfile, preferences: {...userProfile.preferences, budget: parseInt(e.target.value)}})}/>
                <span className="range-val">${userProfile.preferences.budget}</span>
              </div>
            </div>
         </div>
         <div className="form-actions">
           <Button onClick={handleSaveProfile}>Save Changes</Button>
         </div>
       </Card>
    </div>
  );

  const CollegeDashboard = () => (
    <div className="college-dashboard animate-in">
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-icon icon-blue"><Users size={24}/></div>
          <div className="stat-info"><div className="stat-number">1,240</div><div className="stat-text">Profile Views</div></div>
        </Card>
        <Card className="stat-card">
           <div className="stat-icon icon-green"><Briefcase size={24}/></div>
           <div className="stat-info"><div className="stat-number">85</div><div className="stat-text">New Applications</div></div>
        </Card>
        <Card className="stat-card">
           <div className="stat-icon icon-indigo"><Star size={24}/></div>
           <div className="stat-info"><div className="stat-number">#12</div><div className="stat-text">Global Ranking</div></div>
        </Card>
      </div>

      <div className="dashboard-split">
         <div className="candidates-section">
            <div className="section-header"><h2>Recommended Students (AI)</h2><Button variant="ghost" className="btn-sm">View All</Button></div>
            <div className="candidate-list">
              {students.length ? students.map(student => (
                <Card key={student.id} className="candidate-card">
                  <div className="candidate-left">
                    <div className="candidate-avatar">{student.name.charAt(0)}</div>
                    <div>
                      <h4 className="candidate-name">{student.name}</h4>
                      <div className="candidate-meta"><span>{student.country}</span><span>•</span><span>{student.interest}</span></div>
                    </div>
                  </div>
                  <div className="candidate-right">
                     <span className="candidate-grade">{student.grade} GPA</span>
                     <button onClick={() => setActiveTab('messages')} className="btn-link-sm">Contact</button>
                  </div>
                </Card>
              )) : (
                <div className="empty-state-message">No candidates available yet.</div>
              )}
            </div>
         </div>
         
         <div className="activity-section">
           <h2 className="section-header-text">Recent Activity</h2>
           <Card className="activity-card">
             {[1,2,3,4].map((i) => (
               <div key={i} className="activity-item">
                 <div className="activity-dot"></div>
                 <div>
                   <p className="activity-text"><span className="bold">John D.</span> submitted an application for Computer Science.</p>
                   <p className="activity-time">2 hours ago</p>
                 </div>
               </div>
             ))}
           </Card>
         </div>
      </div>
    </div>
  );

  const DashboardLayout = ({ children }) => (
    <div className="layout-container">
      {Sidebar()}
      <div className="main-content-wrapper">
        <header className="top-header">
          <div className="header-left">
             <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}><Menu/></button>
             <h1 className="page-title">{activeTab.replace('-', ' ')}</h1>
          </div>
          <div className="header-right">
             <button className="icon-btn-notify"><div className="notify-dot"></div><MessageSquare size={20}/></button>
             <div className="user-welcome desktop-only">
                <span className="welcome-text">Welcome,</span>
                <span className="welcome-name">{userProfile.name}</span>
             </div>
          </div>
        </header>
        <main className="main-scroll-area">{children}</main>
      </div>
      {notification && (
        <div className="notification-toast animate-slide-up"><CheckCircle size={20} className="text-success-light" />{notification}</div>
      )}
    </div>
  );

  // --- RENDERING LOGIC ---
  
  // Outer component handles Intro Loader safely
  if (showIntro) return <IntroLoader onComplete={() => setShowIntro(false)} />;
  
  // Call internal views as functions
  if (view === 'landing') return LandingPage();
  if (view === 'auth') return AuthScreen();

  // Call DashboardLayout as a function, passing children explicitly
  return DashboardLayout({
    children: (
      <>
        {activeTab === 'home' && userRole === 'student' && StudentHome()}
        {activeTab === 'home' && userRole === 'college' && CollegeDashboard()}
        {activeTab === 'messages' && ChatView()}
        {activeTab === 'profile' && StudentProfile()}
        {activeTab === 'students' && CollegeDashboard()}
        {activeTab === 'applications' && (
          <div className="applications-view animate-in">
             <div className="empty-state-icon"><Briefcase size={32}/></div>
             <h3 className="empty-title">Your Applications</h3>
             <p className="empty-desc">Track the status of your university applications here.</p>
             <div className="app-list">
                {applications.length ? applications.map((app) => (
                  <div key={app._id || `${app.collegeId}-${app.studentId}`} className="app-item">
                     <div className="app-info">
                       <div className="app-logo">{app.collegeName?.slice(0, 2).toUpperCase()}</div>
                       <div><div className="app-name">{app.collegeName}</div><div className="app-date">Applied {new Date(app.appliedAt).toLocaleDateString()}</div></div>
                     </div>
                     <Badge color={app.status === 'Under Review' ? 'yellow' : 'indigo'}>{app.status}</Badge>
                  </div>
                )) : (
                  <div className="empty-state-message">No applications have been submitted yet.</div>
                )}
             </div>
          </div>
        )}
      </>
    )
  });
}