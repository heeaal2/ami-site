import React, { useState, useEffect } from 'react';
import './App.css';
import * as XLSX from 'xlsx';

function AdminPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    capacity: '',
    image: ''
  });
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/events');
      if (!response.ok) {
        throw new Error('Failed to fetch admin data');
      }
      const data = await response.json();
      setEvents(data);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    console.log('newEvent.image specifically:', newEvent.image);
    console.log('Submitting event:', JSON.stringify(newEvent, null, 2));
    try {
      const response = await fetch('http://localhost:5001/api/admin/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEvent),
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      setConfirmation({
        title: newEvent.title,
        image: newEvent.image
      });
      // Reset form and refresh events
      setNewEvent({
        title: '',
        description: '',
        date: '',
        location: '',
        capacity: '',
        image: ''
      });
      setShowCreateForm(false);
      fetchAdminData();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/admin/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      // Refresh events list
      fetchAdminData();
      alert('Event deleted successfully!');
    } catch (error) {
      setError(error.message);
      alert('Error deleting event: ' + error.message);
    }
  };

  // Excel export function
  const handleExportExcel = () => {
    // Flatten all attendees for all events
    const allRows = [];
    events.forEach(event => {
      if (event.attendees && event.attendees.length > 0) {
        event.attendees.forEach(att => {
          allRows.push({
            Event: event.eventTitle || event.title,
            Description: event.description,
            Date: new Date(event.eventDate || event.date).toLocaleDateString(),
            Location: event.location,
            Name: att.name,
            Phone: att.phoneNumber,
            'Attendance Date': new Date(att.attendDate).toLocaleDateString(),
            'Registration Date': new Date(att.registrationDate).toLocaleDateString(),
          });
        });
      } else {
        allRows.push({
          Event: event.eventTitle || event.title,
          Description: event.description,
          Date: new Date(event.eventDate || event.date).toLocaleDateString(),
          Location: event.location,
          Name: '',
          Phone: '',
          'Attendance Date': '',
          'Registration Date': '',
        });
      }
    });
    const ws = XLSX.utils.json_to_sheet(allRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Events & Attendees');
    XLSX.writeFile(wb, 'events_attendees.xlsx');
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="admin-page">
      <h1>Admin Dashboard</h1>
      
      <button 
        className="create-event-btn"
        onClick={() => setShowCreateForm(!showCreateForm)}
      >
        {showCreateForm ? 'Cancel' : 'Create New Event'}
      </button>

      <button className="create-event-btn" style={{background:'#2196f3',marginLeft:8}} onClick={handleExportExcel}>
        Export to Excel
      </button>

      {showCreateForm && (
        <div className="create-event-form">
          <h2>Create New Event</h2>
          <form onSubmit={handleCreateEvent}>
            <div className="form-group">
              <label>Title:</label>
              <input
                type="text"
                name="title"
                value={newEvent.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                name="description"
                value={newEvent.description}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Date:</label>
              <input
                type="datetime-local"
                name="date"
                value={newEvent.date}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Location:</label>
              <input
                type="text"
                name="location"
                value={newEvent.location}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Capacity:</label>
              <input
                type="number"
                name="capacity"
                value={newEvent.capacity}
                onChange={handleInputChange}
                required
                min="1"
              />
            </div>
            <div className="form-group">
              <label>Event Image Path:</label>
              <input
                type="text"
                name="image"
                value={newEvent.image}
                onChange={handleInputChange}
                placeholder="/event-images/quran.jpg"
              />
            </div>
            <button type="submit" className="submit-btn">Create Event</button>
          </form>
        </div>
      )}

      {confirmation && (
        <div className="confirmation-message" style={{margin: '20px 0', padding: '16px', background: '#e6ffe6', borderRadius: '8px'}}>
          <strong>Event "{confirmation.title}" created successfully!</strong>
          {confirmation.image && (
            <div style={{marginTop: '10px'}}>
              <img src={confirmation.image} alt="Event" style={{maxWidth: 120, borderRadius: 6}} />
              <div style={{fontSize: '0.9em', marginTop: 4}}>{confirmation.image}</div>
            </div>
          )}
          <button style={{marginTop: '10px'}} onClick={() => setConfirmation(null)}>Dismiss</button>
        </div>
      )}

      <div className="events-list">
        {events.map((event, index) => (
          <div key={index} className="event-section">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h2>{event.eventTitle}</h2>
              <button 
                className="delete-btn"
                onClick={() => handleDeleteEvent(event._id, event.eventTitle)}
                style={{
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Delete Event
              </button>
            </div>
            <p>Event Date: {new Date(event.eventDate).toLocaleDateString()}</p>
            {event.image && (
              <img src={event.image} alt="Event" style={{maxWidth: 100, marginBottom: 10}} />
            )}
            <h3>Attendees ({event.attendees.length})</h3>
            <div className="attendees-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone Number</th>
                    <th>Attendance Date</th>
                    <th>Registration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {event.attendees.map((attendee, idx) => (
                    <tr key={idx}>
                      <td>{attendee.name}</td>
                      <td>{attendee.phoneNumber}</td>
                      <td>{new Date(attendee.attendDate).toLocaleDateString()}</td>
                      <td>{new Date(attendee.registrationDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminPage; 