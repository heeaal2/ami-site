# AMI Event Management - Deployment Guide

## Features Added
- ✅ **Image Upload**: Admin can now upload images for events instead of typing file paths
- ✅ **File Preview**: Shows preview of selected image before uploading
- ✅ **Automatic File Management**: Images are stored in `/public/event-images/` with unique filenames
- ✅ **Production Ready**: URLs automatically switch between development and production

## Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Backend Server**:
   ```bash
   node server.js
   ```
   Server runs on http://localhost:5001

3. **Start Frontend (in new terminal)**:
   ```bash
   npm start
   ```
   Frontend runs on http://localhost:3000

4. **Admin Access**:
   - Click footer logo → Enter password: `bismillah123`
   - Upload images for events using the file picker
   - Export attendee data to Excel

## Vercel Deployment

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel
   ```

3. **Configure Environment**:
   - Set `MONGODB_URI` in Vercel dashboard
   - The app will automatically use production URLs

## Important Notes
- **Backend**: Currently runs on localhost:5001 (needs separate hosting for production)
- **Database**: Requires MongoDB connection
- **Images**: Uploaded images are stored locally (consider cloud storage for production)
- **Admin Password**: Change `bismillah123` for production use

## File Structure
```
AMI/
├── src/
│   ├── components/    # React components
│   ├── AdminPage.js   # Admin panel with image upload
│   └── App.js         # Main application
├── public/
│   └── event-images/  # Uploaded event images
├── server.js          # Express backend
└── vercel.json        # Vercel configuration
``` 