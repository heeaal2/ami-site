import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import EventCard from './components/EventCard';
import './App.css';
import AdminPage from './AdminPage';

function EventsOnly({ events, loading, handleEventSelect, usingFallbackData, refreshEvents }) {
  return (
    <main className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="ongoing-title" style={{ margin: 0 }}>Events</h2>
        <button 
          onClick={refreshEvents}
          disabled={loading}
          style={{
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            opacity: loading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>🔄</span>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      {usingFallbackData && (
        <div style={{
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '10px',
          borderRadius: '5px',
          margin: '10px 0',
          textAlign: 'center'
        }}>
          ⚠️ Showing sample events. Backend server is currently unavailable.
        </div>
      )}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner-main"></div>
          <p>Loading events...</p>
        </div>
      ) : (
        <div className="event-cards-row">
          {events.map((event, idx) => {
            const eventDate = new Date(event.date);
            const dateStr = eventDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            // Display time in Malaysian timezone since backend stores it correctly
            const timeStr = eventDate.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              timeZone: 'Asia/Kuala_Lumpur',
              hour12: true // Show AM/PM
            });
            return (
              <div key={event._id || idx} onClick={() => handleEventSelect(event)} style={{ cursor: 'pointer' }}>
                <EventCard
                  title={event.title}
                  date={dateStr}
                  time={timeStr}
                  location={event.location}
                  image={event.image}
                />
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({ name: '', phoneNumber: '', attendDate: '' });
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [usingFallbackData, setUsingFallbackData] = useState(false);


  const fetchEvents = async () => {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://ami-backend-g4hd.onrender.com'
      : 'http://localhost:5001';
    
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${baseUrl}/api/events`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
              setEvents(data);
        setUsingFallbackData(false);
    } catch (err) {
      // Fallback data when backend is not available
      console.log('Backend not available, using fallback data:', err.message);
      setUsingFallbackData(true);
      setEvents([
        {
          _id: '1',
          title: 'Weekly Quran Study',
          description: 'Join us for our weekly Quran study session',
          date: '2025-06-15T19:00:00Z',
          location: 'Community Center',
          capacity: 50,
          image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&auto=format',
          registeredUsers: []
        },
        {
          _id: '2', 
          title: 'Community Iftar',
          description: 'Breaking fast together as a community',
          date: '2025-06-20T18:30:00Z',
          location: 'Main Hall',
          capacity: 100,
          image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop&auto=format',
          registeredUsers: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []); // Fetch events on component mount

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if using fallback data
    if (usingFallbackData) {
      alert('Registration is currently unavailable. Please try again later when the server is online.');
      return;
    }
    
    try {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://ami-backend-g4hd.onrender.com'
        : 'http://localhost:5001';
      const response = await fetch(`${baseUrl}/api/events/${selectedEvent._id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Registration successful!');
        setFormData({ name: '', phoneNumber: '', attendDate: '' });
        setSelectedEvent(null);
        setEvents(events => events.map(ev => ev._id === data.event._id ? data.event : ev));
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Error registering for event');
    }
  };

  const handleFooterLogoClick = () => {
    setShowAdminLogin(true);
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'bismillah123') {
      setIsAdminAuthenticated(true);
      setShowAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword('');
    } else {
      alert('Incorrect password');
    }
  };

  const handleContactClick = () => {
    const footer = document.querySelector('.footer');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const refreshEvents = () => {
    setLoading(true);
    fetchEvents();
  };

  const handleBackToMain = () => {
    setShowAdmin(false);
    setIsAdminAuthenticated(false);
    // Refresh events when returning from admin
    setTimeout(() => {
      refreshEvents();
    }, 100);
  };

  if (showAdmin && isAdminAuthenticated) {
    return <AdminPage onBackToMain={handleBackToMain} />;
  }

  return (
    <div className="main-bg">
      <Header onContactClick={handleContactClick} />
      <Routes>
        <Route path="/" element={
          <main className="main-content">
            <div className="ami-title-section">
              <h1 className="ami-title">AMI</h1>
              <h2 className="ami-subtitle">Asosiasi Muslim Indonesia</h2>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 className="ongoing-title" style={{ margin: 0 }}>Events</h2>
              <button 
                onClick={refreshEvents}
                disabled={loading}
                style={{
                  backgroundColor: '#2196f3',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: loading ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>🔄</span>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            {usingFallbackData && (
              <div style={{
                backgroundColor: '#fff3cd',
                color: '#856404',
                padding: '10px',
                borderRadius: '5px',
                margin: '10px 0',
                textAlign: 'center'
              }}>
                ⚠️ Showing sample events. Backend server is currently unavailable.
              </div>
            )}
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner-main"></div>
                <p>Loading events...</p>
              </div>
            ) : (
              <div className="event-cards-row">
                {events.map((event, idx) => {
                  const eventDate = new Date(event.date);
                  const dateStr = eventDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                  // Display time in Malaysian timezone since backend stores it correctly
                  const timeStr = eventDate.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZone: 'Asia/Kuala_Lumpur',
                    hour12: true // Show AM/PM
                  });
                  return (
                    <div key={event._id || idx} onClick={() => handleEventSelect(event)} style={{ cursor: 'pointer' }}>
                      <EventCard
                        title={event.title}
                        date={dateStr}
                        time={timeStr}
                        location={event.location}
                        image={event.image}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            {selectedEvent && (
              <div className="event-details-modal">
                <div className="event-details-content">
                  <button className="close-btn" onClick={() => setSelectedEvent(null)} aria-label="Close">&times;</button>
                  <h2>{selectedEvent.title}</h2>
                  <p><strong>Description:</strong> {selectedEvent.description}</p>
                  <p><strong>Date:</strong> {new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p><strong>Time:</strong> {new Date(selectedEvent.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur', hour12: true })}</p>
                  <p><strong>Location:</strong> {selectedEvent.location}</p>
                  <p><strong>Available Spots:</strong> {selectedEvent.capacity - selectedEvent.registeredUsers.length}</p>
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label htmlFor="name">Name:</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phoneNumber">Phone Number:</label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="attendDate">Date to Attend:</label>
                      <input
                        type="date"
                        id="attendDate"
                        name="attendDate"
                        value={formData.attendDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <button type="submit" disabled={usingFallbackData}>
                      {usingFallbackData ? 'Registration Unavailable' : 'Register'}
                    </button>
                  </form>
                </div>
              </div>
            )}
            {showAdminLogin && (
              <div className="admin-login-modal">
                <form onSubmit={handleAdminLogin} className="admin-login-form">
                  <input
                    type="password"
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    autoFocus
                  />
                  <button type="submit">Login</button>
                  <button type="button" onClick={() => setShowAdminLogin(false)}>Cancel</button>
                </form>
              </div>
            )}
          </main>
        } />
        <Route path="/events" element={
          <EventsOnly events={events} loading={loading} handleEventSelect={handleEventSelect} usingFallbackData={usingFallbackData} refreshEvents={refreshEvents} />
        } />
      </Routes>
      <Footer onLogoClick={handleFooterLogoClick} />
    </div>
  );
}

export default App;
