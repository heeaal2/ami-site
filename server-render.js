const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://ami-site-xyz.vercel.app'], // Add your Vercel URL
  credentials: true
}));
app.use(bodyParser.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public/event-images');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/event-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
});

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

// File upload route
app.post('/api/upload', upload.single('image'), (req, res) => {
  console.log('📸 File upload route hit!');
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const imagePath = `/event-images/${req.file.filename}`;
    console.log('✅ File uploaded successfully:', imagePath);
    res.json({ 
      message: 'File uploaded successfully',
      imagePath: imagePath,
      originalName: req.file.originalname
    });
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    res.status(500).json({ message: error.message });
  }
});

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

// Admin routes
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

app.post('/api/admin/events', async (req, res) => {
  console.log('🔥 Admin create event route hit!');
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

app.delete('/api/admin/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const deletedEvent = await Event.findByIdAndDelete(eventId);
    
    if (!deletedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json({ message: 'Event deleted successfully', event: deletedEvent });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AMI Backend is running' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 AMI Backend running on port ${PORT}`);
}); 