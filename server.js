const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware - Configure CORS properly for production
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all Vercel domains and localhost
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:3002',
      'https://ami-site-rho.vercel.app'
    ];
    
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    // For now, allow all origins to debug
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
}));
app.use(bodyParser.json({ limit: '20mb' }));

// Additional manual CORS headers as backup
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

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
    // Use original filename with timestamp to avoid conflicts
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 20 * 1024 * 1024 // 5MB limit
  }
});

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

// Test upload route (simple)
app.post('/api/upload/test', (req, res) => {
  console.log('🧪 Upload test route hit!');
  res.json({ message: 'Upload test route is working' });
});

// File upload route
app.post('/api/upload', (req, res) => {
  console.log('📸 File upload route hit!');
  console.log('Request headers:', req.headers);
  console.log('Content-Type:', req.get('Content-Type'));
  
  // Use multer middleware manually to get better error handling
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('❌ Multer error:', err);
      return res.status(500).json({ message: 'Upload error: ' + err.message });
    }
    
    try {
      console.log('📁 Upload directory:', uploadsDir);
      console.log('📁 Directory exists:', fs.existsSync(uploadsDir));
      
      if (!req.file) {
        console.log('❌ No file in request');
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      console.log('📄 File details:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        path: req.file.path
      });
      
      // Return full URL for production, relative path for development
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://ami-backend-g4hd.onrender.com'
        : 'http://localhost:5001';
      const imagePath = `${baseUrl}/event-images/${req.file.filename}`;
      console.log('✅ File uploaded successfully:', imagePath);
      res.json({ 
        message: 'File uploaded successfully',
        imagePath: imagePath,
        originalName: req.file.originalname
      });
    } catch (error) {
      console.error('❌ Error processing upload:', error);
      res.status(500).json({ message: error.message });
    }
  });
});

// Routes
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find();
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://ami-backend-g4hd.onrender.com'
      : 'http://localhost:5001';
    
    // Convert relative image paths to full URLs
    const eventsWithFullUrls = events.map(event => ({
      ...event.toObject(),
      image: event.image && event.image.startsWith('/') 
        ? `${baseUrl}${event.image}` 
        : event.image
    }));
    
    res.json(eventsWithFullUrls);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/events/:eventId/register', async (req, res) => {
  console.log('🎯 Registration route hit!');
  console.log('Event ID:', req.params.eventId);
  console.log('Request body:', req.body);
  try {
    const { eventId } = req.params;
    const { name, phoneNumber, attendDate } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      console.log('❌ Event not found:', eventId);
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.registeredUsers.length >= event.capacity) {
      console.log('❌ Event is full');
      return res.status(400).json({ message: 'Event is full' });
    }

    console.log('📝 Adding user to event:', { name, phoneNumber, attendDate });
    event.registeredUsers.push({ name, phoneNumber, attendDate });
    await event.save();
    console.log('✅ User registered successfully! Total registered:', event.registeredUsers.length);

    res.json({ message: 'Registration successful', event });
  } catch (error) {
    console.error('❌ Error registering for event:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add a test route to verify server is running
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Debug route to check upload configuration
app.get('/api/upload/debug', (req, res) => {
  res.json({
    message: 'Upload debug info',
    uploadsDir: uploadsDir,
    dirExists: fs.existsSync(uploadsDir),
    publicDir: path.join(__dirname, 'public'),
    publicExists: fs.existsSync(path.join(__dirname, 'public')),
    cwd: process.cwd(),
    __dirname: __dirname
  });
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
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://ami-backend-g4hd.onrender.com'
      : 'http://localhost:5001';
    
    const formattedEvents = events.map(event => ({
      _id: event._id,
      eventTitle: event.title,
      eventDate: event.date,
      image: event.image && event.image.startsWith('/') 
        ? `${baseUrl}${event.image}` 
        : event.image, // Convert relative paths to full URLs
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