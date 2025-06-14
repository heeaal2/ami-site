import React, { useState, useEffect } from 'react';
import './App.css';
import * as XLSX from 'xlsx';

function AdminPage({ onBackToMain }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    capacity: '',
    image: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://ami-backend-g4hd.onrender.com'
        : 'http://localhost:5001';
      const response = await fetch(`${baseUrl}/api/admin/events`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch admin data');
      }
      const data = await response.json();
      setEvents(data);
      setBackendAvailable(true);
      setLoading(false);
    } catch (error) {
      console.log('Backend not available for admin panel');
      setBackendAvailable(false);
      setEvents([]); // Empty events when backend is down
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Image path will be set after successful upload
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    if (!backendAvailable) {
      alert('Cannot create events while backend is unavailable. Please try again later.');
      return;
    }
    
    try {
      // First, upload the image if one is selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('image', selectedFile);
        
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://ami-backend-g4hd.onrender.com' 
          : 'http://localhost:5001';
        const uploadResponse = await fetch(`${baseUrl}/api/upload`, {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }
        
        const uploadResult = await uploadResponse.json();
        // Update the event with the actual uploaded image path
        newEvent.image = uploadResult.imagePath;
      }

      console.log('Submitting event:', JSON.stringify(newEvent, null, 2));
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://ami-backend-g4hd.onrender.com' 
        : 'http://localhost:5001';
      const response = await fetch(`${baseUrl}/api/admin/events`, {
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
      setSelectedFile(null);
      setImagePreview(null);
      setShowCreateForm(false);
      fetchAdminData();
    } catch (error) {
      alert('Error creating event: ' + error.message);
    }
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (!backendAvailable) {
      alert('Cannot delete events while backend is unavailable. Please try again later.');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
      return;
    }

    try {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://ami-backend-g4hd.onrender.com' 
        : 'http://localhost:5001';
      const response = await fetch(`${baseUrl}/api/admin/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      // Refresh events list
      fetchAdminData();
      alert('Event deleted successfully!');
    } catch (error) {
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

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Admin Dashboard</h1>
        <button 
          onClick={onBackToMain}
          style={{
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Back to Main
        </button>
      </div>
      
      {!backendAvailable && (
        <div style={{
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '15px',
          borderRadius: '5px',
          margin: '10px 0',
          textAlign: 'center'
        }}>
          ⚠️ Backend server is currently unavailable. Admin features are limited.
        </div>
      )}
      
      <button 
        className="create-event-btn"
        onClick={() => setShowCreateForm(!showCreateForm)}
        disabled={!backendAvailable}
        style={{
          opacity: backendAvailable ? 1 : 0.5,
          cursor: backendAvailable ? 'pointer' : 'not-allowed'
        }}
      >
        {showCreateForm ? 'Cancel' : 'Create New Event'}
      </button>

      <button 
        className="create-event-btn" 
        style={{
          background:'#2196f3',
          marginLeft:8,
          opacity: events.length > 0 ? 1 : 0.5,
          cursor: events.length > 0 ? 'pointer' : 'not-allowed'
        }} 
        onClick={handleExportExcel}
        disabled={events.length === 0}
      >
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
              <label>Event Image:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{marginBottom: '10px'}}
              />
              {imagePreview && (
                <div style={{marginTop: '10px'}}>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{maxWidth: '200px', maxHeight: '150px', borderRadius: '8px'}}
                  />
                  <p style={{fontSize: '0.9em', marginTop: '5px', color: '#666'}}>
                    Preview: {selectedFile?.name}
                  </p>
                </div>
              )}
            </div>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={!backendAvailable}
              style={{
                opacity: backendAvailable ? 1 : 0.5,
                cursor: backendAvailable ? 'pointer' : 'not-allowed'
              }}
            >
              Create Event
            </button>
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
        {events.length === 0 ? (
          <div style={{
            textAlign: 'center', 
            padding: '40px', 
            color: '#666',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            margin: '20px 0'
          }}>
            {backendAvailable ? 'No events created yet.' : 'No events available while backend is offline.'}
          </div>
        ) : (
          events.map((event, index) => (
          <div key={index} className="event-section">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h2>{event.eventTitle}</h2>
              <button 
                className="delete-btn"
                onClick={() => handleDeleteEvent(event._id, event.eventTitle)}
                disabled={!backendAvailable}
                style={{
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: backendAvailable ? 'pointer' : 'not-allowed',
                  opacity: backendAvailable ? 1 : 0.5
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
          ))
        )}
      </div>
    </div>
  );
}

export default AdminPage; 