const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.path}`);
  next();
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// MongoDB Connection with better error handling
try {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/event-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });
} catch (error) {
  console.error('Error in MongoDB connection setup:', error);
  process.exit(1);
}

// Event Schema
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  capacity: { type: Number, required: true },
  image: { type: String, default: '' },
  registeredUsers: [{
    name: String,
    phoneNumber: String,
    registrationDate: { type: Date, default: Date.now },
    attendDate: { type: Date }
  }]
});

const Event = mongoose.model('Event', eventSchema);

// Routes
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/events/:eventId/register', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, phoneNumber, attendDate } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.registeredUsers.length >= event.capacity) {
      return res.status(400).json({ message: 'Event is full' });
    }

    event.registeredUsers.push({ name, phoneNumber, attendDate });
    await event.save();

    res.json({ message: 'Registration successful', event });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add a test route to verify server is running
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Add this route temporarily for testing
app.post('/api/events/test', async (req, res) => {
  try {
    const testEvent = new Event({
      title: "Test Event",
      description: "This is a test event.",
      date: new Date(),
      location: "Test Location",
      capacity: 50,
      registeredUsers: []
    });
    await testEvent.save();
    res.json({ message: "Test event added", event: testEvent });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin route to get all events with registered users
app.get('/api/admin/events', async (req, res) => {
  try {
    const events = await Event.find().select('title date registeredUsers image');
    const formattedEvents = events.map(event => ({
      _id: event._id,
      eventTitle: event.title,
      eventDate: event.date,
      image: event.image,
      attendees: event.registeredUsers.map(user => ({
        name: user.name,
        phoneNumber: user.phoneNumber,
        attendDate: user.attendDate,
        registrationDate: user.registrationDate
      }))
    }));
    res.json(formattedEvents);
  } catch (error) {
    console.error('Error fetching admin data:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin route to create new event (with logging)
console.log('Registering admin event creation route');
app.post('/api/admin/events', async (req, res) => {
  console.log('🔥 Admin create event route hit!');
  console.log('Request body:', req.body);
  try {
    const { title, description, date, location, capacity, image } = req.body;
    const newEvent = new Event({
      title,
      description,
      date: new Date(date),
      location,
      capacity,
      image: image || '',
      registeredUsers: []
    });
    await newEvent.save();
    console.log('✅ Event saved successfully:', newEvent.title);
    res.status(201).json({ message: 'Event created successfully', event: newEvent });
  } catch (error) {
    console.error('❌ Error creating event:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin route to delete an event
app.delete('/api/admin/events/:eventId', async (req, res) => {
  console.log('🗑️ Delete event route hit!');
  console.log('Event ID to delete:', req.params.eventId);
  try {
    const { eventId } = req.params;
    const deletedEvent = await Event.findByIdAndDelete(eventId);
    
    if (!deletedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    console.log('✅ Event deleted successfully:', deletedEvent.title);
    res.json({ message: 'Event deleted successfully', event: deletedEvent });
  } catch (error) {
    console.error('❌ Error deleting event:', error);
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5001;
console.log('Using port:', PORT);
try {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} catch (error) {
  console.error('Error starting server:', error);
  process.exit(1);
}